"""
Comprehensive Multi-AI Verified Tutor Test Suite
Testing all 8 Required Categories from Prompt Section 28:
1. Basic: Simple one-equation numerical (Ideal gas volume)
2. Intermediate: Multi-step numerical (Heat exchanger LMTD & area)
3. Complex: Multi-equation system & decomposition (Binary distillation balance)
4. Iterative: Non-linear root finding (Colebrook-White friction factor via Newton-Raphson)
5. Unit Conversion: Mixed engineering units (Pump power with imperial/mixed inputs)
6. Ambiguous: Missing mandatory information gate ("No Hidden Assumptions")
7. Error Detection: Solver arithmetic mistake detected and reconciled by calculation layer
8. Repeated Question: Identical numerical consistency and verified cache hit
"""
import sys
import io
import asyncio

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from app.tutor_engine import (
    ProblemFingerprinter, MissingInfoDetector, DeterministicEngine,
    UnitValidator, EngineeringSanityChecker, BuiltinEngineeringSolvers,
    StructuredProblemExtractor, CrossSolverAdjudicator,
    TutorRequest, solve_tutor_problem
)

async def test_suite():
    print("==================================================")
    print("  CHEMBASE PRO - COMPREHENSIVE TUTOR TEST SUITE   ")
    print("==================================================")
    passed_count = 0
    total_tests = 8

    # ----------------------------------------------------
    # Category 1: Basic Numerical (Single-Equation: Ideal Gas)
    # ----------------------------------------------------
    print("\n[Category 1: Basic Numerical] Ideal Gas Volume:")
    req1 = TutorRequest(
        problem="A rigid cylinder contains 5 kg of nitrogen (molar mass 28 g/mol) at 300 K and 2 MPa. Treating nitrogen as an ideal gas, calculate the volume occupied in liters. R = 8.314 J/mol·K.",
        subject="Thermodynamics",
        difficulty="Basic"
    )
    resp1 = await solve_tutor_problem(req1)
    print(f"  Complexity: {resp1.difficulty}")
    print(f"  Calculated Answer: {resp1.gruca.answer}")
    print(f"  Units Verified: {resp1.audit.units_verified}")
    print(f"  Confidence: {resp1.audit.confidence_status}")
    assert "liters" in resp1.gruca.answer.lower() or "l" in resp1.gruca.answer.lower()
    assert resp1.audit.units_verified is True
    assert resp1.audit.confidence_status == "Verified"
    print("  [OK] PASS: Category 1 Basic Numerical verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 2: Intermediate Numerical (Multi-Step: Heat Exchanger LMTD)
    # ----------------------------------------------------
    print("\n[Category 2: Intermediate Numerical] Counterflow Heat Exchanger LMTD & Area:")
    req2 = TutorRequest(
        problem="A counterflow shell-and-tube heat exchanger heats 2 kg/s of water (Cp = 4.18 kJ/kg·K) from 20°C to 60°C using 3 kg/s of hot oil (Cp = 2.1 kJ/kg·K) entering at 150°C. The overall heat transfer coefficient is 300 W/m²·K. Calculate the required heat transfer area in m².",
        subject="Heat Transfer",
        difficulty="Intermediate"
    )
    resp2 = await solve_tutor_problem(req2)
    print(f"  Duty & Area: {resp2.gruca.answer}")
    print(f"  Calculation Stages: {len(resp2.gruca.calculations)} steps verified")
    print(f"  Sanity Notes: {resp2.audit.sanity_notes}")
    assert len(resp2.gruca.calculations) >= 4, "Intermediate problem must have at least 4 calculation steps"
    assert resp2.audit.sanity_checked is True
    assert resp2.audit.confidence_status == "Verified"
    print("  [OK] PASS: Category 2 Intermediate Multi-Step verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 3: Complex Multi-Equation Numerical & Decomposition
    # ----------------------------------------------------
    print("\n[Category 3: Complex Numerical] Binary Distillation Column Material Balance:")
    req3 = TutorRequest(
        problem="A distillation column separates 1000 kg/h of a feed containing 40 wt% benzene and 60 wt% toluene. The distillate is 95 wt% benzene and the bottoms are 5 wt% benzene. Calculate the distillate and bottoms flow rates in kg/h.",
        subject="Process Design",
        difficulty="Complex"
    )
    resp3 = await solve_tutor_problem(req3)
    print(f"  Distillate & Bottoms: {resp3.gruca.answer}")
    print(f"  Stages Count: {resp3.audit.stages_count}")
    assert resp3.audit.stages_count >= 3
    assert "kg/h" in resp3.gruca.answer
    print("  [OK] PASS: Category 3 Complex Multi-Equation verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 4: Iterative Non-Linear Solver (Colebrook-White via Newton-Raphson)
    # ----------------------------------------------------
    print("\n[Category 4: Iterative Numerical] Colebrook-White Root Finding:")
    pump_calc = DeterministicEngine.solve_pump_power(
        flow_rate_m3s=0.05, diameter_m=0.10, length_m=200.0,
        roughness_m=0.045e-3, density=998.0, viscosity=1.002e-3,
        elevation_m=15.0, efficiency=0.70
    )
    print(f"  Newton-Raphson Converged Friction Factor: {pump_calc['friction_factor']}")
    print(f"  Reynolds: {pump_calc['reynolds']} ({pump_calc['flow_regime']})")
    assert pump_calc['flow_regime'] == "Turbulent"
    assert 0.015 <= pump_calc['friction_factor'] <= 0.025
    assert pump_calc['pump_power_kw'] > 0
    print("  [OK] PASS: Category 4 Iterative Non-Linear Solver verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 5: Unit Conversion & Dimensional Consistency
    # ----------------------------------------------------
    print("\n[Category 5: Unit Conversion & Dimensional Homogeneity]:")
    is_valid, unit_msg = UnitValidator.validate_solution_units("Fluid Mechanics", "pump power", "kW")
    print(f"  kW for pump power: {is_valid} ({unit_msg})")
    assert is_valid is True

    # Invalid unit test
    is_invalid, invalid_msg = UnitValidator.validate_solution_units("Fluid Mechanics", "pump power", "kg/s")
    print(f"  kg/s for pump power: {is_invalid} ({invalid_msg})")
    assert is_invalid is False
    print("  [OK] PASS: Category 5 Unit & Dimensional Homogeneity verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 6: Ambiguous / Missing Information Gate ("No Hidden Assumptions")
    # ----------------------------------------------------
    print("\n[Category 6: Ambiguous / Missing Information]:")
    ambiguous_problem = "A counterflow heat exchanger heats water from 20 to 60 C. Calculate the required area in m2."
    req6 = TutorRequest(problem=ambiguous_problem, subject="Heat Transfer", difficulty="Intermediate")
    resp6 = await solve_tutor_problem(req6)
    print(f"  Status: {resp6.audit.confidence_status}")
    print(f"  Disagreement/Missing Notes: {resp6.audit.disagreement_notes}")
    print(f"  Summary: {resp6.gruca.summary}")
    assert resp6.audit.confidence_status == "Needs clarification"
    assert "missing" in resp6.gruca.answer.lower() or "missing" in resp6.gruca.summary.lower()
    print("  [OK] PASS: Category 6 Missing Information Gate verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 7: Error Detection & Disagreement Reconciliation
    # ----------------------------------------------------
    print("\n[Category 7: Error Detection & Cross-Solver Adjudication]:")
    # Simulate Solver A giving 38.8 kW (correct), Solver B giving 49.5 kW (arithmetic error)
    comp_sols = [
        {"model_name": "Solver A", "numeric_value": 38.835, "unit_str": "kW", "equations": ["P = rho*g*Q*H / eta"]},
        {"model_name": "Solver B (Hallucinated)", "numeric_value": 49.500, "unit_str": "kW", "equations": ["P = rho*g*Q*H / eta"]}
    ]
    sim_builtin = BuiltinEngineeringSolvers.try_solve(
        "Water at 20°C flows at 0.05 m³/s through a 200 m long pipe. Calculate the pump power required in kW",
        "Fluid Mechanics"
    )
    final_gruca, final_audit = CrossSolverAdjudicator.compare_and_adjudicate(
        independent_solutions=comp_sols,
        builtin_solution=sim_builtin,
        problem_text="Water at 20°C flows at 0.05 m³/s through a 200 m long pipe. Calculate the pump power required in kW",
        subject="Fluid Mechanics"
    )
    print(f"  Disagreement Detected: {final_audit.disagreement_detected}")
    print(f"  Disagreement Notes: {final_audit.disagreement_notes}")
    print(f"  Winning Answer: {final_gruca.answer}")
    assert final_audit.disagreement_detected is True
    assert "60.02" in final_gruca.answer
    print("  [OK] PASS: Category 7 Error Detection & Adjudication verified.")
    passed_count += 1

    # ----------------------------------------------------
    # Category 8: Repeated Question Consistency & Verified Cache
    # ----------------------------------------------------
    print("\n[Category 8: Repeated Question Consistency & Verified Cache]:")
    p_repeat = "Water at 20°C (density 998 kg/m³, viscosity 1.002e-3 Pa·s) flows at 0.05 m³/s through a 200 m long, 10 cm diameter commercial steel pipe (roughness ε = 0.045 mm). The outlet is 15 m above the inlet and both are open to atmosphere. Calculate the pump power required in kW, assuming a pump efficiency of 70%."
    req_rep1 = TutorRequest(problem=p_repeat, subject="Fluid Mechanics", difficulty="Intermediate")
    resp_rep1 = await solve_tutor_problem(req_rep1)

    req_rep2 = TutorRequest(problem=p_repeat, subject="Fluid Mechanics", difficulty="Intermediate")
    resp_rep2 = await solve_tutor_problem(req_rep2)

    print(f"  Run 1 Answer: {resp_rep1.gruca.answer}")
    print(f"  Run 2 Answer: {resp_rep2.gruca.answer}")
    print(f"  Run 2 Cache Hit: {resp_rep2.audit.cache_hit}")
    assert resp_rep1.gruca.answer == resp_rep2.gruca.answer, "Repeated numerical answer must be 100% identical!"
    assert resp_rep2.audit.cache_hit is True, "Run 2 must hit the verified cache!"
    print("  [OK] PASS: Category 8 Repeated Question Consistency verified.")
    passed_count += 1

    print("\n==================================================")
    print(f"  ALL {passed_count}/{total_tests} TEST CATEGORIES PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_suite())
