# Design Specification: Multi-AI Verified Chemical Engineering Solver for ChemBase Tutor

**Date**: 2026-09-21  
**Module**: ChemBase Pro → Tutor (`backend/app/tutor_engine.py`, `frontend/src/pages/TutorPage.tsx`, `frontend/src/api.ts`)  
**Scope**: Work strictly within the existing Tutor module. Zero changes to other modules.

---

## 1. Problem Statement & Objectives

Currently, AI-based numerical solvers in chemical engineering education suffer from a critical flaw:
> *"The same numerical can sometimes produce different answers when submitted again, or introduce subtle arithmetic, unit, or conceptual errors."*

This upgrade transforms the ChemBase Tutor into a **Multi-Stage Verified Engineering Solver** prioritizing:
`CONSISTENCY + MATHEMATICAL CORRECTNESS + UNIT CONSISTENCY + ENGINEERING LOGIC + VERIFICATION`.

### Core Development Principle
- **AI** is responsible for problem interpretation, identification of unknowns, and formulation of governing equations.
- **Deterministic Calculation Engine (SymPy, NumPy, SciPy)** is responsible for programmatic numeric substitution, powers, logs, exponentials, matrix solving, and iterative non-linear root finding.
- **Multiple Independent AI Solvers** solve problems in complete isolation without seeing peer responses.
- **Unit & Dimensional Homogeneity Validator** confirms SI unit consistency and dimension cancellation before presentation.
- **Engineering Sanity Engine** enforces physical feasibility bounds across 11 chemical engineering domains.
- **Cross-Solver Comparator & Final Adjudicator** detects divergences, recalculates disputed steps programmatically, and resolves disagreements.
- **Normalized Fingerprint & Verified Cache** guarantees 100% identical outputs for identical problems.

---

## 2. Architecture & Pipeline

```
USER QUESTION
     ↓
1. PROBLEM PARSER & NORMALIZER
     ↓
2. CANONICAL FINGERPRINT & VERIFIED CACHE LOOKUP
   (Hit? Return verified computational result immediately)
     ↓
3. MISSING INFORMATION & AMBIGUITY GATE
   (Underspecified? Explain missing data without fabricating assumptions)
     ↓
4. STRUCTURED PROBLEM EXTRACTION & TYPE CLASSIFIER
   (Given, Unknowns, Conditions, Justified Assumptions, Equations, Subject, Complexity)
     ↓
5. PROBLEM DECOMPOSITION (For Complex Multi-Stage Problems)
   (Step 1: Material Bal. → Step 2: VLE/Properties → Step 3: Energy Bal. → Step 4: Sizing)
     ↓
6. MULTIPLE INDEPENDENT SOLVERS (Concurrent & Isolated Dispatch)
   [Solver A: Gemini]  |  [Solver B: Groq]  |  [Solver C: OpenRouter/Nvidia/Nova]
     ↓
7. DETERMINISTIC CALCULATION & SYMBOLIC VERIFICATION ENGINE
   (SymPy equation check + SciPy Newton-Raphson / root finding + Programmatic evaluation)
     ↓
8. UNIT & DIMENSION CHECK
   (SI standard conversion, dimension vector homogeneous cancellation)
     ↓
9. ENGINEERING SANITY CHECK
   (Fluid regime, positive duty/areas, non-negative volumes, conversion bounds, mass closure)
     ↓
10. CROSS-SOLVER COMPARISON & DISAGREEMENT PROTOCOL
    (Relative difference threshold: |A - B| / max(|A|, |B|))
     ↓
11. FINAL ADJUDICATOR & VERIFIED SOLUTION SYNTHESIS
     ↓
FINAL STRUCTURED SOLUTION (GRUCA) + AUDIT PROOF CARD
```

---

## 3. Detailed Component Design

### 3.1. Structured Problem Representation & Classifier (`StructuredProblemExtractor`)
- **11 Domain Classifications**:
  1. Material & Energy Balances
  2. Thermodynamics
  3. Fluid Mechanics
  4. Heat Transfer
  5. Mass Transfer
  6. Reaction Engineering
  7. Separation Processes
  8. Process Control
  9. Particulate Technology
  10. Process Design
  11. Numerical Methods
- **Complexity Classifier**:
  - `Simple`: 1–2 independent explicit equations.
  - `Intermediate`: 3–5 coupled algebraic equations.
  - `Complex`: Iterative, multi-stage, system equations, or recycle loops.
- **Zero Hidden Assumptions**:
  - If critical degrees of freedom are missing (e.g., pipe diameter omitted when calculating velocity, or heat exchanger missing both inlet/outlet temperatures), return `Needs Clarification` with explicit bulleted missing parameters.
  - Standard justified engineering assumptions (e.g. steady-state, incompressible liquid, ideal gas, adiabatic shell) are explicitly labeled with engineering justification.

### 3.2. Deterministic Calculation & Symbolic Engine (`DeterministicEngine`)
- **Built-in Precision Solvers for Core Problems**:
  - Fluid Mechanics: Flow velocity, Reynolds, Colebrook-White friction factor via Newton-Raphson, Darcy-Weisbach head loss, pump power.
  - Heat Transfer: Heat duty $Q = \dot{m} C_p \Delta T$, counterflow terminal $\Delta T_1$ and $\Delta T_2$, LMTD, required surface area $A = Q / (U \Delta T_{lm})$.
  - Reaction Engineering: CSTR design equation $V = F_{A0} X_A / (-r_A)$, space time $\tau$, concentration profiles.
  - Mass Transfer: Ammonia diffusion through stagnant air, log-mean partial pressure $p_{BM}$, steady-state molar flux $N_A$.
  - Thermodynamics: Ideal gas law $PV = nRT$, real gas compressibility factor $Z$, thermodynamic state property calculation.
  - Separation / Distillation: Binary mass balance $F = D + B$, $F x_F = D x_D + B x_B$ via 2x2 linear matrix inversion, component recoveries.
- **Dynamic Programmatic Expression Evaluator**:
  - Extracts arithmetic expressions from solver steps and re-computes them programmatically using Python's `math`, `numpy`, and `scipy` rather than relying on language model mental arithmetic.
  - Supports non-linear root finding (Newton-Raphson, Bisection) with convergence criteria $|f(x)| < 10^{-6}$.

### 3.3. Unit Consistency & Dimensional Homogeneity (`UnitValidator`)
- Base SI dimension mapping: $[M, L, T, \Theta, N]$ (Mass, Length, Time, Temperature, Amount).
- Verification of Left-Hand Side vs Right-Hand Side dimensional equality.
- Automated conversion from imperial/industrial units (psi, gpm, cP, BTU, bar, atm) to SI equivalents.

### 3.4. Engineering Sanity & Plausibility Checker (`EngineeringSanityChecker`)
- Validates that calculated values sit within physical and industrial operational bounds:
  - Friction factor: $0.008 \le f \le 0.10$.
  - Pump efficiency: $0 < \eta \le 1.0$.
  - Heat exchanger area: $A > 0$ and $A < 10,000 \text{ m}^2$.
  - Chemical reactor conversion: $0 \le X \le 1.0$.
  - Total mass balance closure: $|In - Out| / In < 10^{-4}$.
  - Mole/mass fractions: $0 \le x_i \le 1.0$ and $\sum x_i = 1.0$.

### 3.5. Multi-AI Independent Dispatch & Cross-Solver Adjudicator
- **Independent Execution**: Models receive the structured problem in parallel without knowledge of other solvers' answers.
- **Tolerance Comparison**:
  $$\text{Relative Difference} = \frac{|A - B|}{\max(|A|, |B|)}$$
  - Relative diff $\le 2\%$: High consensus ($98-100\%$).
  - Relative diff $> 2\%$: Disagreement flagged, recalculation triggered.
- **Adjudicator Protocol**:
  - Prioritizes deterministic mathematical evaluations over LLM arithmetic.
  - Verifies equation validity and assumption justification.
  - Synthesizes the winning GRUCA solution with full audit trail.

### 3.6. User Interface (`TutorPage.tsx`)
- **Subtle Pipeline Progress**:
  `Analyzing → Solving → Verifying → Finalizing`
- **Complex Problem Stage Notice**:
  `🔄 Complex Problem Detected: Decomposing into N Calculation Stages`
- **Audit Proof Drawer**:
  - Cross-Solver Independent Agreement (breakdown of each solver value).
  - Deterministic Calculation Engine Verification (SymPy/SciPy confirmation).
  - Unit & Dimensional Homogeneity Status.
  - Engineering Sanity Bounds Verification.
- **Verified Result Card**:
  - Status badges: `Verified` (Green), `Verified with Stated Assumptions` (Sky), `Needs Clarification / Missing Data` (Amber).
  - Instant Verified Cache Hit indicator.

---

## 4. Verification & Testing Strategy

A dedicated test suite (`backend/test_tutor_engine_comprehensive.py`) covering all 8 test categories:
1. **Basic**: Simple one-equation numerical (Ideal gas volume).
2. **Intermediate**: Multi-step numerical (Counterflow heat exchanger LMTD & area).
3. **Complex**: Multi-equation system (Binary distillation mass balance).
4. **Iterative**: Non-linear root finding (Colebrook-White friction factor via Newton-Raphson).
5. **Unit Conversion**: Mixed engineering units (Imperial to SI pump power).
6. **Ambiguous / Missing Info**: Underspecified heat exchanger missing temperature/U parameters.
7. **Error Detection**: Arithmetic or equation error caught and reconciled by the deterministic calculation layer.
8. **Repeated Question**: Submitting the same question multiple times yields 100% identical numerical results and cache hits.
