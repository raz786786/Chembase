-- ==========================================
-- ChemBase Pro: Bulletproof Schema Patch & Seed
-- ==========================================
DO $$ 
BEGIN
    -- Create base table if it somehow doesn't exist
    CREATE TABLE IF NOT EXISTS public.chembase_equipment_knowledge (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        subject TEXT NOT NULL
    );
    -- Safely add ALL columns to chembase_equipment_knowledge
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN category TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_equipment_knowledge ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
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

    -- Create experiments base table
    CREATE TABLE IF NOT EXISTS public.chembase_experiment_knowledge (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL
    );
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN equipment_id UUID REFERENCES public.chembase_equipment_knowledge(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN typical_objective TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN theory_concepts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN required_observations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN relevant_equations JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN graph_possibilities JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.chembase_experiment_knowledge ADD COLUMN viva_concepts JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;

    -- Create records base table
    CREATE TABLE IF NOT EXISTS public.lab_analytics_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject TEXT NOT NULL
    );
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN equipment_id UUID REFERENCES public.chembase_equipment_knowledge(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.lab_analytics_records ADD COLUMN experiment_id UUID REFERENCES public.chembase_experiment_knowledge(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN END;
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

-- Setup strict RLS policies so Supabase doesn't block the UI fetch
ALTER TABLE public.chembase_equipment_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read built-in equipment" ON public.chembase_equipment_knowledge;
CREATE POLICY "Anyone can read built-in equipment" ON public.chembase_equipment_knowledge FOR SELECT USING (is_custom = false);

DROP POLICY IF EXISTS "Users can manage their custom equipment" ON public.chembase_equipment_knowledge;
CREATE POLICY "Users can manage their custom equipment" ON public.chembase_equipment_knowledge FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.chembase_experiment_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read experiments" ON public.chembase_experiment_knowledge;
CREATE POLICY "Anyone can read experiments" ON public.chembase_experiment_knowledge FOR SELECT USING (true);

ALTER TABLE public.lab_analytics_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own lab records" ON public.lab_analytics_records;
CREATE POLICY "Users can manage their own lab records" ON public.lab_analytics_records FOR ALL USING (auth.uid() = user_id);

-- Clear old built-in data so we don't get duplicates
DELETE FROM public.chembase_equipment_knowledge WHERE is_custom = false;

INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('c657658d-812c-4501-be07-0ceebee324f5', false, 'fluid-mechanics', 'Standard Equipment', 'Reynolds Apparatus', 'Standard Reynolds Apparatus used in fluid mechanics laboratories.', 'The Reynolds Apparatus operates based on fundamental principles of fluid mechanics.', 'The Reynolds Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('a88f9bd8-46e7-45c4-a040-c18fa9d0a837', false, 'fluid-mechanics', 'Standard Equipment', 'Venturi Meter', 'Standard Venturi Meter used in fluid mechanics laboratories.', 'The Venturi Meter operates based on fundamental principles of fluid mechanics.', 'The Venturi Meter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9b07bf4d-a19e-42e7-9de5-dd7bf452bc0f', false, 'fluid-mechanics', 'Standard Equipment', 'Orifice Meter', 'Standard Orifice Meter used in fluid mechanics laboratories.', 'The Orifice Meter operates based on fundamental principles of fluid mechanics.', 'The Orifice Meter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('36658917-ea73-42b9-afcb-a0d163c8b4d3', false, 'fluid-mechanics', 'Standard Equipment', 'Rotameter', 'Standard Rotameter used in fluid mechanics laboratories.', 'The Rotameter operates based on fundamental principles of fluid mechanics.', 'The Rotameter operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('dc2144f6-2e33-497e-bf64-b03a31c3106f', false, 'fluid-mechanics', 'Standard Equipment', 'Bernoulli Apparatus', 'Standard Bernoulli Apparatus used in fluid mechanics laboratories.', 'The Bernoulli Apparatus operates based on fundamental principles of fluid mechanics.', 'The Bernoulli Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('219dd40e-da3b-4589-9813-550e3f4b57b1', false, 'fluid-mechanics', 'Standard Equipment', 'Pipe Friction Apparatus', 'Standard Pipe Friction Apparatus used in fluid mechanics laboratories.', 'The Pipe Friction Apparatus operates based on fundamental principles of fluid mechanics.', 'The Pipe Friction Apparatus operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0b5c4ed4-1857-4882-8163-75284cd99cb3', false, 'fluid-mechanics', 'Standard Equipment', 'Pitot Tube', 'Standard Pitot Tube used in fluid mechanics laboratories.', 'The Pitot Tube operates based on fundamental principles of fluid mechanics.', 'The Pitot Tube operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('cc60e266-462b-47ee-a416-c87b4a0c5001', false, 'fluid-mechanics', 'Standard Equipment', 'Centrifugal Pump', 'Standard Centrifugal Pump used in fluid mechanics laboratories.', 'The Centrifugal Pump operates based on fundamental principles of fluid mechanics.', 'The Centrifugal Pump operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('ced19b6f-323d-4e23-9b4c-1fa322fb6fd1', false, 'fluid-mechanics', 'Standard Equipment', 'Reciprocating Pump', 'Standard Reciprocating Pump used in fluid mechanics laboratories.', 'The Reciprocating Pump operates based on fundamental principles of fluid mechanics.', 'The Reciprocating Pump operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('37992f47-8bce-47fe-91aa-5b455922c898', false, 'fluid-mechanics', 'Standard Equipment', 'Flow Measurement Equipment', 'Standard Flow Measurement Equipment used in fluid mechanics laboratories.', 'The Flow Measurement Equipment operates based on fundamental principles of fluid mechanics.', 'The Flow Measurement Equipment operates based on fundamental principles of fluid mechanics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9fa40c11-6fc1-4fb5-bb2e-22ade0c60088', false, 'heat-transfer', 'Standard Equipment', 'Shell & Tube Heat Exchanger', 'Standard Shell & Tube Heat Exchanger used in heat transfer laboratories.', 'The Shell & Tube Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Shell & Tube Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('eb55082c-19d4-4f43-a8cf-1d8476108a33', false, 'heat-transfer', 'Standard Equipment', 'Double Pipe Heat Exchanger', 'Standard Double Pipe Heat Exchanger used in heat transfer laboratories.', 'The Double Pipe Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Double Pipe Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('de8818d1-79d5-4a99-a507-54fa92a287c8', false, 'heat-transfer', 'Standard Equipment', 'Plate Heat Exchanger', 'Standard Plate Heat Exchanger used in heat transfer laboratories.', 'The Plate Heat Exchanger operates based on fundamental principles of heat transfer.', 'The Plate Heat Exchanger operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('a541202d-0fa8-4d56-8dd2-d03f56d7bc01', false, 'heat-transfer', 'Standard Equipment', 'Thermal Conductivity Apparatus', 'Standard Thermal Conductivity Apparatus used in heat transfer laboratories.', 'The Thermal Conductivity Apparatus operates based on fundamental principles of heat transfer.', 'The Thermal Conductivity Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('28296023-d852-4786-a422-68b0b17a6315', false, 'heat-transfer', 'Standard Equipment', 'Composite Wall Apparatus', 'Standard Composite Wall Apparatus used in heat transfer laboratories.', 'The Composite Wall Apparatus operates based on fundamental principles of heat transfer.', 'The Composite Wall Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('86527574-901c-400b-bef3-a9b2c810551f', false, 'heat-transfer', 'Standard Equipment', 'Radiation Apparatus', 'Standard Radiation Apparatus used in heat transfer laboratories.', 'The Radiation Apparatus operates based on fundamental principles of heat transfer.', 'The Radiation Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('f4e6f407-a7b5-4567-ab78-4bb011893ac4', false, 'heat-transfer', 'Standard Equipment', 'Finned Tube Apparatus', 'Standard Finned Tube Apparatus used in heat transfer laboratories.', 'The Finned Tube Apparatus operates based on fundamental principles of heat transfer.', 'The Finned Tube Apparatus operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('272b46be-7bca-4c45-ba79-3c009bf24bdb', false, 'heat-transfer', 'Standard Equipment', 'Heat Transfer Training Unit', 'Standard Heat Transfer Training Unit used in heat transfer laboratories.', 'The Heat Transfer Training Unit operates based on fundamental principles of heat transfer.', 'The Heat Transfer Training Unit operates based on fundamental principles of heat transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('39ed1fb3-402d-4ee4-b7e5-c1aa244c8679', false, 'thermodynamics', 'Standard Equipment', 'Boiler/Steam Generator Training Unit', 'Standard Boiler/Steam Generator Training Unit used in thermodynamics laboratories.', 'The Boiler/Steam Generator Training Unit operates based on fundamental principles of thermodynamics.', 'The Boiler/Steam Generator Training Unit operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('030275ab-7a9c-4424-8205-de450eed4f22', false, 'thermodynamics', 'Standard Equipment', 'Refrigeration Trainer', 'Standard Refrigeration Trainer used in thermodynamics laboratories.', 'The Refrigeration Trainer operates based on fundamental principles of thermodynamics.', 'The Refrigeration Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('ced41c97-bcd5-450d-a5be-2aaa36f77a90', false, 'thermodynamics', 'Standard Equipment', 'Heat Engine Trainer', 'Standard Heat Engine Trainer used in thermodynamics laboratories.', 'The Heat Engine Trainer operates based on fundamental principles of thermodynamics.', 'The Heat Engine Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('f9d36356-b466-4c4d-9edf-a926df38d17d', false, 'thermodynamics', 'Standard Equipment', 'Gas Turbine/Brayton Cycle Trainer', 'Standard Gas Turbine/Brayton Cycle Trainer used in thermodynamics laboratories.', 'The Gas Turbine/Brayton Cycle Trainer operates based on fundamental principles of thermodynamics.', 'The Gas Turbine/Brayton Cycle Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('16aad38e-5edf-4db0-abde-1fc83799db0b', false, 'thermodynamics', 'Standard Equipment', 'Otto/Diesel Cycle Trainer', 'Standard Otto/Diesel Cycle Trainer used in thermodynamics laboratories.', 'The Otto/Diesel Cycle Trainer operates based on fundamental principles of thermodynamics.', 'The Otto/Diesel Cycle Trainer operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('ad3267a0-1726-46b4-b4cc-92e8e24d94c0', false, 'thermodynamics', 'Standard Equipment', 'Calorimeter', 'Standard Calorimeter used in thermodynamics laboratories.', 'The Calorimeter operates based on fundamental principles of thermodynamics.', 'The Calorimeter operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('bbc6f3fa-1840-4c72-9bf4-9d6266d511e8', false, 'thermodynamics', 'Standard Equipment', 'Bomb Calorimeter', 'Standard Bomb Calorimeter used in thermodynamics laboratories.', 'The Bomb Calorimeter operates based on fundamental principles of thermodynamics.', 'The Bomb Calorimeter operates based on fundamental principles of thermodynamics.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('1a892799-0d9e-418b-9a81-8eeb8b3ee914', false, 'mass-transfer', 'Standard Equipment', 'Distillation Column', 'Standard Distillation Column used in mass transfer laboratories.', 'The Distillation Column operates based on fundamental principles of mass transfer.', 'The Distillation Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0bbcdf1f-2a5a-4787-8154-6c85baa3c754', false, 'mass-transfer', 'Standard Equipment', 'Packed Column', 'Standard Packed Column used in mass transfer laboratories.', 'The Packed Column operates based on fundamental principles of mass transfer.', 'The Packed Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9fbf3090-0316-4905-966a-b0f068c9ee5c', false, 'mass-transfer', 'Standard Equipment', 'Tray Column', 'Standard Tray Column used in mass transfer laboratories.', 'The Tray Column operates based on fundamental principles of mass transfer.', 'The Tray Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('0eee5858-9243-42f1-a416-070db4518ee0', false, 'mass-transfer', 'Standard Equipment', 'Absorption Column', 'Standard Absorption Column used in mass transfer laboratories.', 'The Absorption Column operates based on fundamental principles of mass transfer.', 'The Absorption Column operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('82d3e313-21ee-4928-b70a-7e79f53f2e43', false, 'mass-transfer', 'Standard Equipment', 'Liquid-Liquid Extraction Unit', 'Standard Liquid-Liquid Extraction Unit used in mass transfer laboratories.', 'The Liquid-Liquid Extraction Unit operates based on fundamental principles of mass transfer.', 'The Liquid-Liquid Extraction Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('65dc60a7-15e6-4456-a0c9-6f538867f2a7', false, 'mass-transfer', 'Standard Equipment', 'Humidification Unit', 'Standard Humidification Unit used in mass transfer laboratories.', 'The Humidification Unit operates based on fundamental principles of mass transfer.', 'The Humidification Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('5edd3a90-e238-4eb2-a148-eb39a30ff85b', false, 'mass-transfer', 'Standard Equipment', 'Drying Unit', 'Standard Drying Unit used in mass transfer laboratories.', 'The Drying Unit operates based on fundamental principles of mass transfer.', 'The Drying Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('59f6ec7c-eed7-432e-a63f-56e510cd8c99', false, 'mass-transfer', 'Standard Equipment', 'Evaporation Unit', 'Standard Evaporation Unit used in mass transfer laboratories.', 'The Evaporation Unit operates based on fundamental principles of mass transfer.', 'The Evaporation Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('268eae98-9fd7-4440-a3ef-cf8a815165f2', false, 'mass-transfer', 'Standard Equipment', 'Adsorption Unit', 'Standard Adsorption Unit used in mass transfer laboratories.', 'The Adsorption Unit operates based on fundamental principles of mass transfer.', 'The Adsorption Unit operates based on fundamental principles of mass transfer.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9fffd378-b233-4d53-ac11-08fc06f7945e', false, 'particulate-technology', 'Standard Equipment', 'Ball Mill', 'Standard Ball Mill used in particulate technology laboratories.', 'The Ball Mill operates based on fundamental principles of particulate technology.', 'The Ball Mill operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('8718c07f-c252-4779-8701-0d8562f47003', false, 'particulate-technology', 'Standard Equipment', 'Jaw Crusher', 'Standard Jaw Crusher used in particulate technology laboratories.', 'The Jaw Crusher operates based on fundamental principles of particulate technology.', 'The Jaw Crusher operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9449e525-59db-45f4-9fa4-4b6a02bcc273', false, 'particulate-technology', 'Standard Equipment', 'Roll Crusher', 'Standard Roll Crusher used in particulate technology laboratories.', 'The Roll Crusher operates based on fundamental principles of particulate technology.', 'The Roll Crusher operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('5d9651a1-6146-43d8-aa8b-cf51404d323d', false, 'particulate-technology', 'Standard Equipment', 'Hammer Mill', 'Standard Hammer Mill used in particulate technology laboratories.', 'The Hammer Mill operates based on fundamental principles of particulate technology.', 'The Hammer Mill operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('027a806a-66ec-412e-8aac-7c23fd118227', false, 'particulate-technology', 'Standard Equipment', 'Sieve Shaker', 'Standard Sieve Shaker used in particulate technology laboratories.', 'The Sieve Shaker operates based on fundamental principles of particulate technology.', 'The Sieve Shaker operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('d64256c5-29a7-43ec-adfd-c2d1d0445feb', false, 'particulate-technology', 'Standard Equipment', 'Cyclone Separator', 'Standard Cyclone Separator used in particulate technology laboratories.', 'The Cyclone Separator operates based on fundamental principles of particulate technology.', 'The Cyclone Separator operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('ed49a8cb-a9fe-4400-88cf-911b8780662a', false, 'particulate-technology', 'Standard Equipment', 'Sedimentation Apparatus', 'Standard Sedimentation Apparatus used in particulate technology laboratories.', 'The Sedimentation Apparatus operates based on fundamental principles of particulate technology.', 'The Sedimentation Apparatus operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('4c256ce0-8604-495d-8068-94497ce3bd65', false, 'particulate-technology', 'Standard Equipment', 'Fluidized Bed', 'Standard Fluidized Bed used in particulate technology laboratories.', 'The Fluidized Bed operates based on fundamental principles of particulate technology.', 'The Fluidized Bed operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('08319780-4d88-474a-b8a8-cd70834260e8', false, 'particulate-technology', 'Standard Equipment', 'Particle Size Analysis Equipment', 'Standard Particle Size Analysis Equipment used in particulate technology laboratories.', 'The Particle Size Analysis Equipment operates based on fundamental principles of particulate technology.', 'The Particle Size Analysis Equipment operates based on fundamental principles of particulate technology.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('d6691794-6c3a-4cf6-ac40-f397619427be', false, 'reaction-engineering', 'Standard Equipment', 'Batch Reactor', 'Standard Batch Reactor used in reaction engineering laboratories.', 'The Batch Reactor operates based on fundamental principles of reaction engineering.', 'The Batch Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('9ab5bf7a-2687-49bc-8fc4-01a04c132b0a', false, 'reaction-engineering', 'Standard Equipment', 'Continuous Stirred Tank Reactor (CSTR)', 'Standard Continuous Stirred Tank Reactor (CSTR) used in reaction engineering laboratories.', 'The Continuous Stirred Tank Reactor (CSTR) operates based on fundamental principles of reaction engineering.', 'The Continuous Stirred Tank Reactor (CSTR) operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('669b1a39-90ef-497b-8f19-c2a972eba332', false, 'reaction-engineering', 'Standard Equipment', 'Plug Flow Reactor (PFR)', 'Standard Plug Flow Reactor (PFR) used in reaction engineering laboratories.', 'The Plug Flow Reactor (PFR) operates based on fundamental principles of reaction engineering.', 'The Plug Flow Reactor (PFR) operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('4df964bb-116d-4e48-b1f0-4bbdf9945bd3', false, 'reaction-engineering', 'Standard Equipment', 'Packed Bed Reactor', 'Standard Packed Bed Reactor used in reaction engineering laboratories.', 'The Packed Bed Reactor operates based on fundamental principles of reaction engineering.', 'The Packed Bed Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('7ae9c907-e4dd-48ee-8465-10686f7ada33', false, 'reaction-engineering', 'Standard Equipment', 'Fluidized Bed Reactor', 'Standard Fluidized Bed Reactor used in reaction engineering laboratories.', 'The Fluidized Bed Reactor operates based on fundamental principles of reaction engineering.', 'The Fluidized Bed Reactor operates based on fundamental principles of reaction engineering.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('7007ceaa-be71-4f6e-b5d7-3a04719ea90d', false, 'process-control', 'Standard Equipment', 'PID Control Trainer', 'Standard PID Control Trainer used in process control laboratories.', 'The PID Control Trainer operates based on fundamental principles of process control.', 'The PID Control Trainer operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('d2722961-1c0d-46bb-97c9-c6ca6cfd0f56', false, 'process-control', 'Standard Equipment', 'Level Control System', 'Standard Level Control System used in process control laboratories.', 'The Level Control System operates based on fundamental principles of process control.', 'The Level Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('2e8284f0-2df6-430c-b90e-da1be2a695c5', false, 'process-control', 'Standard Equipment', 'Flow Control System', 'Standard Flow Control System used in process control laboratories.', 'The Flow Control System operates based on fundamental principles of process control.', 'The Flow Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('8fd46f7b-f8a6-4a06-bc30-fc87269da34b', false, 'process-control', 'Standard Equipment', 'Temperature Control System', 'Standard Temperature Control System used in process control laboratories.', 'The Temperature Control System operates based on fundamental principles of process control.', 'The Temperature Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('4b6811f8-3cad-40d9-b8c2-057c167106a3', false, 'process-control', 'Standard Equipment', 'Pressure Control System', 'Standard Pressure Control System used in process control laboratories.', 'The Pressure Control System operates based on fundamental principles of process control.', 'The Pressure Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('049ccec1-9f44-4d78-ba7c-be09f36b0f8d', false, 'process-control', 'Standard Equipment', 'pH Control System', 'Standard pH Control System used in process control laboratories.', 'The pH Control System operates based on fundamental principles of process control.', 'The pH Control System operates based on fundamental principles of process control.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('678398d3-9a49-4683-9fd7-181f984a9952', false, 'separation-processes', 'Standard Equipment', 'Filtration Unit', 'Standard Filtration Unit used in separation processes laboratories.', 'The Filtration Unit operates based on fundamental principles of separation processes.', 'The Filtration Unit operates based on fundamental principles of separation processes.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('68a88f22-5337-4bb2-9817-b3358793cf66', false, 'separation-processes', 'Standard Equipment', 'Membrane Separation Unit', 'Standard Membrane Separation Unit used in separation processes laboratories.', 'The Membrane Separation Unit operates based on fundamental principles of separation processes.', 'The Membrane Separation Unit operates based on fundamental principles of separation processes.');
INSERT INTO public.chembase_equipment_knowledge 
(id, is_custom, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('7ae881f0-9c88-4207-9ddc-957275c76abe', false, 'separation-processes', 'Standard Equipment', 'Centrifuge', 'Standard Centrifuge used in separation processes laboratories.', 'The Centrifuge operates based on fundamental principles of separation processes.', 'The Centrifuge operates based on fundamental principles of separation processes.');