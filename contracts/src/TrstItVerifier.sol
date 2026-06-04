// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {
    FHE,
    euint32,
    euint64,
    ebool,
    InEuint32,
    InEuint64
} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// @title TrstItVerifier - confidential rental screening on CoFHE
/// @notice Stores encrypted tenant profiles and runs encrypted threshold
///         comparisons against landlord requirements. Only boolean
///         pass/fail outcomes are ever revealed; raw values stay encrypted.
/// @dev Decryption follows the new (post-v0.1.4) CoFHE flow:
///      1. Contract marks the boolean result publicly decryptable via FHE.allowPublic.
///      2. Off-chain client calls SDK decryptForTx -> gets plaintext + signature.
///      3. Client calls publishVerificationResult on this contract with the
///         signed plaintext for each boolean. Contract verifies and stores.
contract TrstItVerifier {
    struct Profile {
        euint64 salary;             // monthly salary, integer USD
        euint32 creditScore;        // 0..850
        euint32 employmentMonths;   // months at current employer
        bool exists;
    }

    struct Verification {
        address tenant;
        ebool passSalary;
        ebool passCredit;
        ebool passEmployment;
        bool published;
        bool passSalaryR;
        bool passCreditR;
        bool passEmploymentR;
    }

    mapping(address => Profile) private _profiles;
    mapping(uint256 => Verification) private _verifications;
    uint256 public nextVerificationId;

    event ProfileSubmitted(address indexed tenant);
    event VerificationRequested(uint256 indexed verificationId, address indexed tenant);
    event VerificationPublished(uint256 indexed verificationId, bool overallEligible);

    /// @notice Tenant submits an encrypted profile. Overwrites any prior profile.
    function submitProfile(
        InEuint64 calldata inSalary,
        InEuint32 calldata inCredit,
        InEuint32 calldata inEmployment
    ) external {
        euint64 s = FHE.asEuint64(inSalary);
        euint32 c = FHE.asEuint32(inCredit);
        euint32 e = FHE.asEuint32(inEmployment);

        FHE.allowThis(s);
        FHE.allowThis(c);
        FHE.allowThis(e);

        _profiles[msg.sender] = Profile({
            salary: s,
            creditScore: c,
            employmentMonths: e,
            exists: true
        });

        emit ProfileSubmitted(msg.sender);
    }

    function hasProfile(address tenant) external view returns (bool) {
        return _profiles[tenant].exists;
    }

    /// @notice Tenant runs verification against a landlord's plaintext thresholds.
    ///         Only the caller can verify their own profile (prevents
    ///         third-party threshold probing).
    /// @dev Comparisons happen on ciphertext via FHE.gte. Results are marked
    ///      publicly decryptable so either party can request the off-chain
    ///      decrypted boolean via the SDK.
    function verify(
        uint64 minSalary,
        uint32 minCredit,
        uint32 minEmploymentMonths
    ) external returns (uint256 verificationId) {
        Profile storage p = _profiles[msg.sender];
        require(p.exists, "TrstIt: profile missing");

        ebool ps = FHE.gte(p.salary,           FHE.asEuint64(minSalary));
        ebool pc = FHE.gte(p.creditScore,      FHE.asEuint32(minCredit));
        ebool pe = FHE.gte(p.employmentMonths, FHE.asEuint32(minEmploymentMonths));

        FHE.allowThis(ps);
        FHE.allowThis(pc);
        FHE.allowThis(pe);

        FHE.allowPublic(ps);
        FHE.allowPublic(pc);
        FHE.allowPublic(pe);

        verificationId = nextVerificationId++;
        _verifications[verificationId] = Verification({
            tenant: msg.sender,
            passSalary: ps,
            passCredit: pc,
            passEmployment: pe,
            published: false,
            passSalaryR: false,
            passCreditR: false,
            passEmploymentR: false
        });

        emit VerificationRequested(verificationId, msg.sender);
    }

    /// @notice Returns the three encrypted boolean handles for a verification.
    ///         The off-chain client uses these as input to the decryption SDK.
    function getVerificationHandles(uint256 verificationId)
        external
        view
        returns (
            address tenant,
            ebool passSalary,
            ebool passCredit,
            ebool passEmployment
        )
    {
        Verification storage v = _verifications[verificationId];
        require(v.tenant != address(0), "TrstIt: verification not found");
        return (v.tenant, v.passSalary, v.passCredit, v.passEmployment);
    }

    /// @notice After off-chain decryption, anyone can publish the verified
    ///         booleans on-chain. The Threshold Network signature is
    ///         validated by FHE.publishDecryptResult.
    function publishVerificationResult(
        uint256 verificationId,
        bool passSalaryPlain, bytes calldata passSalarySig,
        bool passCreditPlain, bytes calldata passCreditSig,
        bool passEmploymentPlain, bytes calldata passEmploymentSig
    ) external {
        Verification storage v = _verifications[verificationId];
        require(v.tenant != address(0), "TrstIt: verification not found");

        FHE.publishDecryptResult(v.passSalary,     passSalaryPlain,     passSalarySig);
        FHE.publishDecryptResult(v.passCredit,     passCreditPlain,     passCreditSig);
        FHE.publishDecryptResult(v.passEmployment, passEmploymentPlain, passEmploymentSig);

        v.passSalaryR     = passSalaryPlain;
        v.passCreditR     = passCreditPlain;
        v.passEmploymentR = passEmploymentPlain;
        v.published       = true;

        emit VerificationPublished(
            verificationId,
            passSalaryPlain && passCreditPlain && passEmploymentPlain
        );
    }

    /// @notice Read a verification result. `ready` flips true once
    ///         publishVerificationResult has been called.
    function readVerification(uint256 verificationId)
        external
        view
        returns (
            address tenant,
            bool ready,
            bool passSalary,
            bool passCredit,
            bool passEmployment,
            bool overallEligible
        )
    {
        Verification storage v = _verifications[verificationId];
        require(v.tenant != address(0), "TrstIt: verification not found");

        tenant = v.tenant;
        ready = v.published;
        passSalary = v.passSalaryR;
        passCredit = v.passCreditR;
        passEmployment = v.passEmploymentR;
        overallEligible = v.published && v.passSalaryR && v.passCreditR && v.passEmploymentR;
    }
}
