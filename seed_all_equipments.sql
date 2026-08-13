-- ==========================================
-- ChemBase Pro: Schema Patch & Seed Data
-- ==========================================
DO $$ 
BEGIN
    -- Safely add missing columns to chembase_equipment_knowledge
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN is_custom BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN working_principle TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN operating_principle TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN main_components JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN operating_parameters JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN relevant_variables JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN relevant_equations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN calculation_methods JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN possible_observations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN expected_trends JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN graph_possibilities JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN common_errors JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN safety_hazards JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN risk_information JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN required_ppe JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN precautions JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN emergency_actions JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN dos_and_donts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN viva_concepts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN applications JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;

    -- Safely add missing columns to chembase_experiment_knowledge
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN typical_objective TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN theory_concepts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN required_observations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN relevant_equations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN graph_possibilities JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN viva_concepts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;

    -- Safely add missing columns to lab_analytics_records
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN objective TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN observation_data JSONB DEFAULT '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN theory JSONB DEFAULT '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN apparatus JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN procedure JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN calculations TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN results TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN discussion TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN conclusion TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN safety_info JSONB DEFAULT '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    
    -- Safely change calculations type if it already existed as JSONB
    BEGIN ALTER TABLE public.lab_analytics_records ALTER COLUMN calculations DROP DEFAULT, ALTER COLUMN calculations TYPE TEXT USING calculations::text; EXCEPTION WHEN others THEN END;
END $$;

DELETE FROM public.chembase_equipment_knowledge WHERE is_custom = false;

INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('1d666cc0-f098-430b-9b4a-a9e5ba0b70e6', 'fluid-mechanics', 'Standard Equipment', 'Reynolds Apparatus', 'Standard Reynolds Apparatus used in fluid mechanics laboratories.', 'The Reynolds Apparatus operates based on fundamental principles of fluid mechanics.', 'The Reynolds Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('f6cb89db-f1bf-414b-ba32-44b706da6b87', 'fluid-mechanics', 'Standard Equipment', 'Venturi Meter', 'Standard Venturi Meter used in fluid mechanics laboratories.', 'The Venturi Meter operates based on fundamental principles of fluid mechanics.', 'The Venturi Meter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('a7ea4e70-b20f-4ff5-8feb-84740a899c60', 'fluid-mechanics', 'Standard Equipment', 'Orifice Meter', 'Standard Orifice Meter used in fluid mechanics laboratories.', 'The Orifice Meter operates based on fundamental principles of fluid mechanics.', 'The Orifice Meter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('c0f1ae20-d33f-42dd-bbe9-8b15b8c14be9', 'fluid-mechanics', 'Standard Equipment', 'Rotameter', 'Standard Rotameter used in fluid mechanics laboratories.', 'The Rotameter operates based on fundamental principles of fluid mechanics.', 'The Rotameter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('64f8d992-8dd8-4d48-8dec-f9eb10937229', 'fluid-mechanics', 'Standard Equipment', 'Bernoulli Apparatus', 'Standard Bernoulli Apparatus used in fluid mechanics laboratories.', 'The Bernoulli Apparatus operates based on fundamental principles of fluid mechanics.', 'The Bernoulli Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('369a6644-6780-4f6a-93cc-548c5aac9a0f', 'fluid-mechanics', 'Standard Equipment', 'Pipe Friction Apparatus', 'Standard Pipe Friction Apparatus used in fluid mechanics laboratories.', 'The Pipe Friction Apparatus operates based on fundamental principles of fluid mechanics.', 'The Pipe Friction Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('af605e28-1d55-44d3-a5eb-97187b0ff69a', 'fluid-mechanics', 'Standard Equipment', 'Pitot Tube', 'Standard Pitot Tube used in fluid mechanics laboratories.', 'The Pitot Tube operates based on fundamental principles of fluid mechanics.', 'The Pitot Tube operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('df56af9d-647b-40d5-90f3-bb482834e0d6', 'fluid-mechanics', 'Standard Equipment', 'Centrifugal Pump', 'Standard Centrifugal Pump used in fluid mechanics laboratories.', 'The Centrifugal Pump operates based on fundamental principles of fluid mechanics.', 'The Centrifugal Pump operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('210f2674-2794-4255-9c43-0addeb0a8ff9', 'fluid-mechanics', 'Standard Equipment', 'Reciprocating Pump', 'Standard Reciprocating Pump used in fluid mechanics laboratories.', 'The Reciprocating Pump operates based on fundamental principles of fluid mechanics.', 'The Reciprocating Pump operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('fb852520-5abd-4c5d-b491-e1e1e480d050', 'fluid-mechanics', 'Standard Equipment', 'Flow Measurement Equipment', 'Standard Flow Measurement Equipment used in fluid mechanics laboratories.', 'The Flow Measurement Equipment operates based on fundamental principles of fluid mechanics.', 'The Flow Measurement Equipment operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('01b264bf-3f5f-4c1a-8f07-983a93619c8f', 'heat-transfer', 'Standard Equipment', 'Shell & Tube Heat Exchanger', 'Standard Shell & Tube Heat Exchanger used in heat transfer laboratories.', 'The Shell & Tube Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Shell & Tube Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('14c311d4-9ac0-419a-a652-1f36a1359831', 'heat-transfer', 'Standard Equipment', 'Double Pipe Heat Exchanger', 'Standard Double Pipe Heat Exchanger used in heat transfer laboratories.', 'The Double Pipe Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Double Pipe Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('c6ecd951-bf39-4a0b-8595-c9472f5e02cb', 'heat-transfer', 'Standard Equipment', 'Plate Heat Exchanger', 'Standard Plate Heat Exchanger used in heat transfer laboratories.', 'The Plate Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Plate Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('e4bd258e-4ec1-4a28-a490-8ba5083483c7', 'heat-transfer', 'Standard Equipment', 'Thermal Conductivity Apparatus', 'Standard Thermal Conductivity Apparatus used in heat transfer laboratories.', 'The Thermal Conductivity Apparatus operates based on fundamental principles of heat transfer.', 'The Thermal Conductivity Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('84671514-481b-4876-b4d1-1a4ed81d6438', 'heat-transfer', 'Standard Equipment', 'Composite Wall Apparatus', 'Standard Composite Wall Apparatus used in heat transfer laboratories.', 'The Composite Wall Apparatus operates based on fundamental principles of heat transfer.', 'The Composite Wall Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('8b46c9e8-ebac-45c4-8172-c843ff697eef', 'heat-transfer', 'Standard Equipment', 'Radiation Apparatus', 'Standard Radiation Apparatus used in heat transfer laboratories.', 'The Radiation Apparatus operates based on fundamental principles of heat transfer.', 'The Radiation Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('5c4a45c3-d93f-4fdf-9338-1976ca981024', 'heat-transfer', 'Standard Equipment', 'Finned Tube Apparatus', 'Standard Finned Tube Apparatus used in heat transfer laboratories.', 'The Finned Tube Apparatus operates based on fundamental principles of heat transfer.', 'The Finned Tube Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('72cf6dde-2f59-482c-bd63-b9b5d44d9e14', 'heat-transfer', 'Standard Equipment', 'Heat Transfer Training Unit', 'Standard Heat Transfer Training Unit used in heat transfer laboratories.', 'The Heat Transfer Training Unit operates based on fundamental principles of heat transfer.', 'The Heat Transfer Training Unit operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('a4ae83db-67ee-466e-b52b-f7e60859e4fa', 'thermodynamics', 'Standard Equipment', 'Boiler/Steam Generator Training Unit', 'Standard Boiler/Steam Generator Training Unit used in thermodynamics laboratories.', 'The Boiler/Steam Generator Training Unit operates based on fundamental principles of thermodynamics.', 'The Boiler/Steam Generator Training Unit operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('230c4bb9-ec54-4fee-a986-f938a8a7685f', 'thermodynamics', 'Standard Equipment', 'Refrigeration Trainer', 'Standard Refrigeration Trainer used in thermodynamics laboratories.', 'The Refrigeration Trainer operates based on fundamental principles of thermodynamics.', 'The Refrigeration Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('98ab539b-f59d-4d09-91b6-848d20ab84ad', 'thermodynamics', 'Standard Equipment', 'Heat Engine Trainer', 'Standard Heat Engine Trainer used in thermodynamics laboratories.', 'The Heat Engine Trainer operates based on fundamental principles of thermodynamics.', 'The Heat Engine Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('5fcfdc3e-f665-47a3-a0ed-fb56be656195', 'thermodynamics', 'Standard Equipment', 'Gas Turbine/Brayton Cycle Trainer', 'Standard Gas Turbine/Brayton Cycle Trainer used in thermodynamics laboratories.', 'The Gas Turbine/Brayton Cycle Trainer operates based on fundamental principles of thermodynamics.', 'The Gas Turbine/Brayton Cycle Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('e57749be-5a9e-4882-9154-429149c5d052', 'thermodynamics', 'Standard Equipment', 'Otto/Diesel Cycle Trainer', 'Standard Otto/Diesel Cycle Trainer used in thermodynamics laboratories.', 'The Otto/Diesel Cycle Trainer operates based on fundamental principles of thermodynamics.', 'The Otto/Diesel Cycle Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('da4e64d5-d161-4d2a-adf2-1ee373546f85', 'thermodynamics', 'Standard Equipment', 'Calorimeter', 'Standard Calorimeter used in thermodynamics laboratories.', 'The Calorimeter operates based on fundamental principles of thermodynamics.', 'The Calorimeter operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('c58cdbc6-98ee-4555-a398-2bae85213fd4', 'thermodynamics', 'Standard Equipment', 'Bomb Calorimeter', 'Standard Bomb Calorimeter used in thermodynamics laboratories.', 'The Bomb Calorimeter operates based on fundamental principles of thermodynamics.', 'The Bomb Calorimeter operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('e0a70b41-8fb0-4422-8d57-9859eeb8fbf0', 'mass-transfer', 'Standard Equipment', 'Distillation Column', 'Standard Distillation Column used in mass transfer laboratories.', 'The Distillation Column operates based on fundamental principles of mass transfer.', 'The Distillation Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('501c50bf-8328-4244-8574-1854b52d08d4', 'mass-transfer', 'Standard Equipment', 'Packed Column', 'Standard Packed Column used in mass transfer laboratories.', 'The Packed Column operates based on fundamental principles of mass transfer.', 'The Packed Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('307e2a21-8393-4d6f-b085-dd524adad0ec', 'mass-transfer', 'Standard Equipment', 'Tray Column', 'Standard Tray Column used in mass transfer laboratories.', 'The Tray Column operates based on fundamental principles of mass transfer.', 'The Tray Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('3572fffd-8f6c-4930-8029-294cd0788083', 'mass-transfer', 'Standard Equipment', 'Absorption Column', 'Standard Absorption Column used in mass transfer laboratories.', 'The Absorption Column operates based on fundamental principles of mass transfer.', 'The Absorption Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('34da6951-7f1f-4b22-8d71-17ef9388c625', 'mass-transfer', 'Standard Equipment', 'Liquid-Liquid Extraction Unit', 'Standard Liquid-Liquid Extraction Unit used in mass transfer laboratories.', 'The Liquid-Liquid Extraction Unit operates based on fundamental principles of mass transfer.', 'The Liquid-Liquid Extraction Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('2512243e-dbb6-4240-805c-0ebea94337b2', 'mass-transfer', 'Standard Equipment', 'Humidification Unit', 'Standard Humidification Unit used in mass transfer laboratories.', 'The Humidification Unit operates based on fundamental principles of mass transfer.', 'The Humidification Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0875b0b8-3069-47f8-80af-ef556aca8078', 'mass-transfer', 'Standard Equipment', 'Drying Unit', 'Standard Drying Unit used in mass transfer laboratories.', 'The Drying Unit operates based on fundamental principles of mass transfer.', 'The Drying Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('bc7e0c8a-a558-4a47-b64c-c76676ea75e7', 'mass-transfer', 'Standard Equipment', 'Evaporation Unit', 'Standard Evaporation Unit used in mass transfer laboratories.', 'The Evaporation Unit operates based on fundamental principles of mass transfer.', 'The Evaporation Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0a52b05a-db95-4d63-af78-6d657570b204', 'mass-transfer', 'Standard Equipment', 'Adsorption Unit', 'Standard Adsorption Unit used in mass transfer laboratories.', 'The Adsorption Unit operates based on fundamental principles of mass transfer.', 'The Adsorption Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('da10b691-8293-4ce3-8af6-5e3f2a9bd00c', 'particulate-technology', 'Standard Equipment', 'Ball Mill', 'Standard Ball Mill used in particulate technology laboratories.', 'The Ball Mill operates based on fundamental principles of particulate technology.', 'The Ball Mill operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('94488fcf-2940-4c0f-99c7-393c7b7e48c5', 'particulate-technology', 'Standard Equipment', 'Jaw Crusher', 'Standard Jaw Crusher used in particulate technology laboratories.', 'The Jaw Crusher operates based on fundamental principles of particulate technology.', 'The Jaw Crusher operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9b802849-c659-42a3-ba80-f198e10f258f', 'particulate-technology', 'Standard Equipment', 'Roll Crusher', 'Standard Roll Crusher used in particulate technology laboratories.', 'The Roll Crusher operates based on fundamental principles of particulate technology.', 'The Roll Crusher operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('6f7b7a75-cebd-4af9-a864-c96e9b3f8e59', 'particulate-technology', 'Standard Equipment', 'Hammer Mill', 'Standard Hammer Mill used in particulate technology laboratories.', 'The Hammer Mill operates based on fundamental principles of particulate technology.', 'The Hammer Mill operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('b66d259a-5f32-445e-9838-600d50bef706', 'particulate-technology', 'Standard Equipment', 'Sieve Shaker', 'Standard Sieve Shaker used in particulate technology laboratories.', 'The Sieve Shaker operates based on fundamental principles of particulate technology.', 'The Sieve Shaker operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('816386d1-28eb-47f5-8e64-0a7db95107e0', 'particulate-technology', 'Standard Equipment', 'Cyclone Separator', 'Standard Cyclone Separator used in particulate technology laboratories.', 'The Cyclone Separator operates based on fundamental principles of particulate technology.', 'The Cyclone Separator operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('1d2f7586-3252-45d0-99af-b4c2cbb5d4dd', 'particulate-technology', 'Standard Equipment', 'Sedimentation Apparatus', 'Standard Sedimentation Apparatus used in particulate technology laboratories.', 'The Sedimentation Apparatus operates based on fundamental principles of particulate technology.', 'The Sedimentation Apparatus operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('d0107679-4073-4fc9-bafb-5f937433c92a', 'particulate-technology', 'Standard Equipment', 'Fluidized Bed', 'Standard Fluidized Bed used in particulate technology laboratories.', 'The Fluidized Bed operates based on fundamental principles of particulate technology.', 'The Fluidized Bed operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('1e4d41ab-1d9e-4e30-a3e0-6cde2a5e7a2a', 'particulate-technology', 'Standard Equipment', 'Particle Size Analysis Equipment', 'Standard Particle Size Analysis Equipment used in particulate technology laboratories.', 'The Particle Size Analysis Equipment operates based on fundamental principles of particulate technology.', 'The Particle Size Analysis Equipment operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('d1adc74a-601b-46df-ad1c-045c0bd3f7be', 'reaction-engineering', 'Standard Equipment', 'Batch Reactor', 'Standard Batch Reactor used in reaction engineering laboratories.', 'The Batch Reactor operates based on fundamental principles of reaction engineering.', 'The Batch Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('1226383f-1297-4ecf-b10e-cf4ac2b35e72', 'reaction-engineering', 'Standard Equipment', 'Continuous Stirred Tank Reactor (CSTR)', 'Standard Continuous Stirred Tank Reactor (CSTR) used in reaction engineering laboratories.', 'The Continuous Stirred Tank Reactor (CSTR) operates based on fundamental principles of reaction engineering.', 'The Continuous Stirred Tank Reactor (CSTR) operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('4d2beb49-fe82-43d6-baa7-f127507e0971', 'reaction-engineering', 'Standard Equipment', 'Plug Flow Reactor (PFR)', 'Standard Plug Flow Reactor (PFR) used in reaction engineering laboratories.', 'The Plug Flow Reactor (PFR) operates based on fundamental principles of reaction engineering.', 'The Plug Flow Reactor (PFR) operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('4e0ae772-a61a-43e9-ad6c-94d4837a0d79', 'reaction-engineering', 'Standard Equipment', 'Packed Bed Reactor', 'Standard Packed Bed Reactor used in reaction engineering laboratories.', 'The Packed Bed Reactor operates based on fundamental principles of reaction engineering.', 'The Packed Bed Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('8d1702ff-4704-41e8-84e1-01370489a60b', 'reaction-engineering', 'Standard Equipment', 'Fluidized Bed Reactor', 'Standard Fluidized Bed Reactor used in reaction engineering laboratories.', 'The Fluidized Bed Reactor operates based on fundamental principles of reaction engineering.', 'The Fluidized Bed Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('29ad7e07-fc56-49a1-bbc0-d046103f0a5b', 'process-control', 'Standard Equipment', 'PID Control Trainer', 'Standard PID Control Trainer used in process control laboratories.', 'The PID Control Trainer operates based on fundamental principles of process control.', 'The PID Control Trainer operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('fe7076a3-b73f-40b3-ada5-ccbd9370bd55', 'process-control', 'Standard Equipment', 'Level Control System', 'Standard Level Control System used in process control laboratories.', 'The Level Control System operates based on fundamental principles of process control.', 'The Level Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0f482aa9-7041-4690-b066-d92b3590481a', 'process-control', 'Standard Equipment', 'Flow Control System', 'Standard Flow Control System used in process control laboratories.', 'The Flow Control System operates based on fundamental principles of process control.', 'The Flow Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('31916c7e-344a-45ed-8ddc-947f327f9914', 'process-control', 'Standard Equipment', 'Temperature Control System', 'Standard Temperature Control System used in process control laboratories.', 'The Temperature Control System operates based on fundamental principles of process control.', 'The Temperature Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('3f429f44-e647-44da-93d8-5e0dd6d607de', 'process-control', 'Standard Equipment', 'Pressure Control System', 'Standard Pressure Control System used in process control laboratories.', 'The Pressure Control System operates based on fundamental principles of process control.', 'The Pressure Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('e3d73168-bce1-4118-b10a-6fedcdd25517', 'process-control', 'Standard Equipment', 'pH Control System', 'Standard pH Control System used in process control laboratories.', 'The pH Control System operates based on fundamental principles of process control.', 'The pH Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('89f86b36-5d0c-4dc9-bfa9-4a62521c870f', 'separation-processes', 'Standard Equipment', 'Filtration Unit', 'Standard Filtration Unit used in separation processes laboratories.', 'The Filtration Unit operates based on fundamental principles of separation processes.', 'The Filtration Unit operates based on fundamental principles of separation processes.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('c1f34b5e-7d92-4c22-87fd-868a5896029e', 'separation-processes', 'Standard Equipment', 'Membrane Separation Unit', 'Standard Membrane Separation Unit used in separation processes laboratories.', 'The Membrane Separation Unit operates based on fundamental principles of separation processes.', 'The Membrane Separation Unit operates based on fundamental principles of separation processes.');
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('2f97252b-2f90-4272-bf62-18c5ba4db7e0', 'separation-processes', 'Standard Equipment', 'Centrifuge', 'Standard Centrifuge used in separation processes laboratories.', 'The Centrifuge operates based on fundamental principles of separation processes.', 'The Centrifuge operates based on fundamental principles of separation processes.');