"""
Test Suite for ChemBase Multi-AI Verified Tutor Engine
"""
import sys
import asyncio
from app.tutor_engine import (
    ProblemFingerprinter, MissingInfoDetector, DeterministicEngine,
    UnitValidator, EngineeringSanityChecker, BuiltinEngineeringSolvers,
    TutorRequest, solve_tutor_problem
)

async def run_tests():
    print("==================================================")
    print("Testing ChemBase Multi-AI Verified Tutor Engine")
    print("==================================================")

    # 1. Test Pump Power (Colebrook-White + Scipy Newton-Raphson)
    print("\n[Test 1] Fluid Mechanics - Pump Power & Colebrook-White:")
    res_pump = DeterministicEngine.solve_pump_power(
        flow_rate_m3s=0.05, diameter_m=0.10, length_m=200.0,
        roughness_m=0.045e-3, density=998.0, viscosity=1.002e-3,
        elevation_m=15.0, efficiency=0.70
    )
    print(f"  Velocity: {res_pump['velocity_ms']} m/s")
    print(f"  Reynolds: {res_pump['reynolds']} ({res_pump['flow_regime']})")
    print(f"  Friction Factor f: {res_pump['friction_factor']}")
    print(f"  Head Loss: {res_pump['head_loss_m']} m")
    print(f"  Pump Power: {res_pump['pump_power_kw']} kW")
    assert res_pump['pump_power_kw'] > 0, "Pump power must be positive"
    assert res_pump['friction_factor'] > 0.01 and res_pump['friction_factor'] < 0.05, "Friction factor must be reasonable"

    # 2. Test Heat Exchanger LMTD
    print("\n[Test 2] Heat Transfer - LMTD & Area:")
    res_hx = DeterministicEngine.solve_heat_exchanger_lmtd(
        m_water=2.0, cp_water=4.18, t_w_in=20.0, t_w_out=60.0,
        m_oil=3.0, cp_oil=2.10, t_oil_in=150.0, U_w_m2k=300.0
    )
    print(f"  Heat Duty: {res_hx['duty_kw']} kW")
    print(f"  Oil Exit Temp: {res_hx['t_oil_out_c']} °C")
    print(f"  LMTD: {res_hx['lmtd_c']} °C")
    print(f"  Area: {res_hx['area_m2']} m²")
    assert res_hx['duty_kw'] == 334.4, f"Duty expected 334.4, got {res_hx['duty_kw']}"
    assert res_hx['area_m2'] > 10 and res_hx['area_m2'] < 20, "Area must be reasonable"

    # 3. Test CSTR Reactor Volume
    print("\n[Test 3] Reaction Engineering - CSTR Design:")
    res_cstr = DeterministicEngine.solve_cstr(
        flow_rate_lmin=10.0, ca0=2.0, k_per_min=0.05, conversion=0.90
    )
    print(f"  CSTR Volume: {res_cstr['volume_liters']} L ({res_cstr['volume_m3']} m³)")
    print(f"  Space Time: {res_cstr['space_time_min']} min")
    assert res_cstr['volume_liters'] == 1800.0, f"Expected 1800 L, got {res_cstr['volume_liters']}"

    # 4. Test Ideal Gas Volume
    print("\n[Test 4] Thermodynamics - Ideal Gas Volume:")
    res_gas = DeterministicEngine.solve_ideal_gas_volume(
        mass_kg=5.0, molar_mass_gmol=28.0134, T_k=300.0, P_pa=2.0e6
    )
    print(f"  Moles: {res_gas['moles']} mol")
    print(f"  Volume: {res_gas['volume_liters']} L")
    assert res_gas['volume_liters'] > 200 and res_gas['volume_liters'] < 250, "Gas volume check failed"

    # 5. Test Distillation Binary Balance
    print("\n[Test 5] Process Design - Binary Distillation Balance:")
    res_dist = DeterministicEngine.solve_distillation_binary(
        feed_kgh=1000.0, xF=0.40, xD=0.95, xB=0.05
    )
    print(f"  Distillate D: {res_dist['distillate_kgh']} kg/h")
    print(f"  Bottoms B: {res_dist['bottoms_kgh']} kg/h")
    print(f"  Benzene Recovery: {res_dist['recovery_benzene_pct']} %")
    assert abs(res_dist['distillate_kgh'] + res_dist['bottoms_kgh'] - 1000.0) < 1e-4, "Mass balance failed"

    # 6. Test Missing Information Detector
    print("\n[Test 6] Missing Information Detector:")
    missing_prob = "A counterflow heat exchanger heats water from 20 to 60 C. Calculate the required area in m2."
    has_missing, missing_items = MissingInfoDetector.check_missing_info(missing_prob, "Heat Transfer")
    print(f"  Problem: '{missing_prob}'")
    print(f"  Has missing info: {has_missing}")
    print(f"  Identified missing items: {missing_items}")
    assert has_missing, "Should detect missing overall U or fluid properties"

    # 7. Test Repeat Consistency & Fingerprint Cache
    print("\n[Test 7] Repeat Consistency & Cache Verification:")
    p_text = "Water at 20°C (density 998 kg/m³, viscosity 1.002e-3 Pa·s) flows at 0.05 m³/s through a 200 m long, 10 cm diameter commercial steel pipe (roughness ε = 0.045 mm). The outlet is 15 m above the inlet and both are open to atmosphere. Calculate the pump power required in kW, assuming a pump efficiency of 70%."
    
    req1 = TutorRequest(problem=p_text, subject="Fluid Mechanics", difficulty="Intermediate")
    resp1 = await solve_tutor_problem(req1)
    print(f"  Run 1 Answer: {resp1.gruca.answer}")
    print(f"  Run 1 Cache Hit: {resp1.audit.cache_hit}")
    print(f"  Run 1 Confidence: {resp1.audit.confidence_status}")

    req2 = TutorRequest(problem=p_text, subject="Fluid Mechanics", difficulty="Intermediate")
    resp2 = await solve_tutor_problem(req2)
    print(f"  Run 2 Answer: {resp2.gruca.answer}")
    print(f"  Run 2 Cache Hit: {resp2.audit.cache_hit}")
    
    assert resp1.gruca.answer == resp2.gruca.answer, "Numerical answers must be 100% identical!"
    assert resp2.audit.cache_hit is True, "Run 2 must hit the verified cache!"

    print("\n==================================================")
    print("ALL 7 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
