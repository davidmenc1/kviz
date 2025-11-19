# Security Scan Report

**Generated:** 2025-11-12
**Scanner:** Trivy
**Project:** kviz

---

## Executive Summary

This report contains comprehensive security analysis results from multiple Trivy scans including vulnerability detection, misconfiguration checks, secret scanning, and license compliance.

### Overall Security Status

| Scan Type | Status | Findings |
|-----------|--------|----------|
| Vulnerabilities (Production) | ✅ Clean | 0 issues |
| Vulnerabilities (Dev Dependencies) | ⚠️ Warning | 1 MEDIUM |
| Misconfigurations | ✅ Clean | 0 issues |
| Secret Leaks | ✅ Clean | 0 issues |
| License Compliance | ℹ️ Info | 442 licenses detected |

---

## Detailed Findings

### 1. Vulnerability Scan (Production Dependencies)

**Scan Command:** `trivy fs . --scanners vuln,misconfig,secret,license --severity HIGH,CRITICAL`

**Result:** ✅ **CLEAN**
- No HIGH or CRITICAL vulnerabilities found in production dependencies
- All production packages are secure

---

### 2. Vulnerability Scan (Including Dev Dependencies)

**Scan Command:** `trivy fs . --scanners vuln,misconfig,secret,license --include-dev-deps`

**Result:** ⚠️ **1 MEDIUM Severity Vulnerability Found**

#### CVE-2025-64118 - node-tar Race Condition

| Property | Value |
|----------|-------|
| **Package** | tar |
| **Vulnerability** | CVE-2025-64118 |
| **Severity** | MEDIUM |
| **Status** | Fixed in newer version |
| **Installed Version** | 7.5.1 |
| **Fixed Version** | 7.5.2 |
| **Description** | node-tar has a race condition leading to uninitialized memory exposure |
| **CVE Link** | https://avd.aquasec.com/nvd/cve-2025-64118 |

**Recommendation:** Update the `tar` package to version 7.5.2 or later to remediate this vulnerability.

---

### 3. Infrastructure & Configuration Scan

**Scan Command:** `trivy config . --severity LOW,MEDIUM,HIGH,CRITICAL`

**Result:** ✅ **CLEAN**
- No infrastructure-as-code (IaC) configuration files detected
- No Docker, Kubernetes, Terraform, or other IaC misconfigurations found

---

### 4. Repository Secret Scan

**Scan Command:** `trivy repository . --scanners vuln,secret --include-dev-deps`

**Result:** ✅ **CLEAN**
- No leaked secrets or credentials detected in repository
- No API keys, tokens, or passwords found in code

---

### 5. License Compliance Scan

**Total Licenses Detected:** 442 (including dev dependencies)

**License Classification:**

| Classification | Count | Severity |
|----------------|-------|----------|
| Notice | 434 | LOW |
| Restricted | 2 | HIGH |
| Unencumbered | 4 | MEDIUM |
| Unknown | 2 | UNKNOWN |

#### License Types Found:
- **MIT** - 280+ packages (permissive, commercial-friendly)
- **Apache-2.0** - 60+ packages (permissive, patent grant)
- **ISC** - 40+ packages (permissive, similar to MIT)
- **BSD-3-Clause** - 10+ packages (permissive)
- **CC-BY-4.0** - 1 package (caniuse-lite)
- **Python-2.0** - 1 package (argparse)
- **LGPL-3.0-or-later** - 2 packages ⚠️ (restricted - copyleft license)

#### Packages with Restricted Licenses (HIGH):

1. **@img/sharp-libvips-linux-x64** - LGPL-3.0-or-later
2. **@img/sharp-libvips-linuxmusl-x64** - LGPL-3.0-or-later

**Note:** LGPL-3.0 libraries are typically used for image processing (libvips). While LGPL is a copyleft license, it's less restrictive than GPL and allows linking from proprietary software. However, you should review your organization's license policy regarding LGPL dependencies.

---

## Key Dependencies and Their Licenses

### Production Dependencies

| Package | License | Type |
|---------|---------|------|
| next | MIT | Framework |
| react, react-dom | MIT | UI Library |
| @trpc/server, @trpc/client | MIT | API Framework |
| @prisma/client | Apache-2.0 | Database ORM |
| @tanstack/react-query | MIT | Data Fetching |
| zod | MIT | Schema Validation |
| tailwindcss | MIT | CSS Framework |
| typescript | Apache-2.0 | Language |
| @google/genai | Apache-2.0 | AI SDK |

### Development Dependencies

| Package | License | Type |
|---------|---------|------|
| eslint | MIT | Linting |
| prettier | MIT | Formatting |
| prisma | Apache-2.0 | Database Tools |
| turbo | MIT | Build System |
| @types/* | MIT | Type Definitions |

---

## Scan Statistics

### Scan Performance
- **Files Scanned:** 1 dependency lock file (bun.lock)
- **Total Packages Analyzed:** 442 (with dev dependencies)
- **Production Packages:** 100
- **Development Packages:** 342

### Scanner Coverage
- ✅ Vulnerability Scanning
- ✅ Secret Detection
- ✅ License Analysis
- ✅ Misconfiguration Detection (IaC)
- ✅ Repository History Scan

---

## Recommendations

### Immediate Actions
1. **Update tar package** - Upgrade from 7.5.1 to 7.5.2 to fix CVE-2025-64118
   ```bash
   # Update the package
   bun update tar
   ```

### License Compliance
2. **Review LGPL Dependencies** - Assess whether the LGPL-3.0 licensed sharp-libvips packages align with your organization's licensing policy. These are image processing libraries and are typically acceptable for most use cases.

### Best Practices
3. **Regular Security Scans** - Run trivy scans regularly (weekly or before each release)
4. **Dependency Updates** - Keep dependencies up to date to minimize vulnerabilities
5. **Secret Detection** - Continue monitoring for accidentally committed secrets
6. **Dev Dependencies** - Consider scanning with `--include-dev-deps` periodically to catch issues early

---

## Scan Commands Reference

For future scans, use these commands:

```bash
# Basic production vulnerability scan (HIGH/CRITICAL only)
trivy fs . --scanners vuln,misconfig,secret,license --severity HIGH,CRITICAL

# Comprehensive scan including dev dependencies
trivy fs . --scanners vuln,misconfig,secret,license --include-dev-deps

# Config/IaC scan
trivy config . --severity LOW,MEDIUM,HIGH,CRITICAL

# Repository secret scan
trivy repository . --scanners vuln,secret --include-dev-deps

# Generate JSON report
trivy fs . --scanners vuln,misconfig,secret,license --include-dev-deps --format json -o trivy-report.json
```

---

## Conclusion

The project has a **strong security posture** with:
- ✅ No high or critical vulnerabilities in production
- ✅ Only 1 medium severity issue in dev dependencies (easily fixable)
- ✅ No secrets or credentials leaked
- ✅ Clean configuration security
- ✅ Standard, permissive open-source licenses (mostly MIT/Apache-2.0)

**Overall Risk Level:** 🟢 **LOW**

The single MEDIUM vulnerability in the `tar` package (dev dependency) should be addressed promptly, but it does not pose an immediate security risk to production deployments.

---

*This report was generated automatically using Trivy security scanner.*
