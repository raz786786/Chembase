-- ========================================================
-- ChemBase Pro: Lab Analytics Architecture (Database Setup)
-- Run this entire script in your Supabase SQL Editor.
-- ========================================================

-- 1. Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.lab_analytics_records CASCADE;
DROP TABLE IF EXISTS public.lab_analytics_equipment CASCADE;
DROP TABLE IF EXISTS public.chembase_experiment_knowledge CASCADE;
DROP TABLE IF EXISTS public.chembase_equipment_knowledge CASCADE;

-- ========================================================
-- 2. Core Equipment Knowledge Base (Reusable)
-- ========================================================
CREATE TABLE public.chembase_equipment_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_custom BOOLEAN DEFAULT false, -- false for built-in, true for user-added
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null if built-in
    
    -- Basic Info
    subject TEXT NOT NULL,
    category TEXT,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Theory & Principle
    working_principle TEXT,
    operating_principle TEXT,
    main_components JSONB DEFAULT '[]'::jsonb,
    operating_parameters JSONB DEFAULT '[]'::jsonb,
    
    -- Analysis & Knowledge
    relevant_variables JSONB DEFAULT '[]'::jsonb,
    relevant_equations JSONB DEFAULT '[]'::jsonb,
    calculation_methods JSONB DEFAULT '[]'::jsonb,
    possible_observations JSONB DEFAULT '[]'::jsonb,
    expected_trends JSONB DEFAULT '[]'::jsonb,
    graph_possibilities JSONB DEFAULT '[]'::jsonb,
    common_errors JSONB DEFAULT '[]'::jsonb,
    
    -- Safety Profile
    safety_hazards JSONB DEFAULT '[]'::jsonb,
    risk_information JSONB DEFAULT '[]'::jsonb,
    required_ppe JSONB DEFAULT '[]'::jsonb,
    precautions JSONB DEFAULT '[]'::jsonb,
    emergency_actions JSONB DEFAULT '[]'::jsonb,
    dos_and_donts JSONB DEFAULT '[]'::jsonb,
    
    -- Extracurricular
    viva_concepts JSONB DEFAULT '[]'::jsonb,
    applications JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chembase_equipment_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read built-in equipment" ON public.chembase_equipment_knowledge FOR SELECT USING (is_custom = false);
CREATE POLICY "Users can manage their custom equipment" ON public.chembase_equipment_knowledge FOR ALL USING (auth.uid() = user_id);


-- ========================================================
-- 3. Experiment Knowledge Base
-- ========================================================
CREATE TABLE public.chembase_experiment_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID REFERENCES public.chembase_equipment_knowledge(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    typical_objective TEXT,
    theory_concepts JSONB DEFAULT '[]'::jsonb,
    required_observations JSONB DEFAULT '[]'::jsonb,
    relevant_equations JSONB DEFAULT '[]'::jsonb,
    graph_possibilities JSONB DEFAULT '[]'::jsonb,
    viva_concepts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chembase_experiment_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read experiments" ON public.chembase_experiment_knowledge FOR SELECT USING (true);


-- ========================================================
-- 4. Student Lab Records
-- ========================================================
CREATE TABLE public.lab_analytics_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    equipment_id UUID REFERENCES public.chembase_equipment_knowledge(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.chembase_experiment_knowledge(id) ON DELETE SET NULL,
    
    -- Student Inputs
    objective TEXT NOT NULL,
    observation_data JSONB DEFAULT '{}'::jsonb,
    
    -- AI Generated & Student Edited Content
    theory JSONB DEFAULT '{}'::jsonb, -- structured into Principle, Working, Concepts, Equations, Variables, Trends
    apparatus JSONB DEFAULT '[]'::jsonb,
    procedure JSONB DEFAULT '[]'::jsonb,
    calculations TEXT,
    results TEXT,
    discussion TEXT,
    conclusion TEXT,
    safety_info JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lab_analytics_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lab records" ON public.lab_analytics_records FOR ALL USING (auth.uid() = user_id);


-- ========================================================
-- 5. SEED DATA (Built-In Equipment Library)
-- ========================================================

-- Insert Ball Mill
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'particulate', 'Size Reduction', 'Ball Mill', 
 'A cylindrical device used in grinding (or mixing) materials like ores, chemicals, ceramic raw materials and paints.',
 'Size reduction is achieved by impact and attrition. As the cylinder rotates, grinding media (balls) are lifted and drop onto the material.',
 'The critical speed is the speed at which the balls centrifuge and do not fall. Operating speed is usually 65-75% of critical speed.');

-- Insert Ball Mill Experiments
INSERT INTO public.chembase_experiment_knowledge (equipment_id, name, typical_objective) VALUES 
('11111111-1111-1111-1111-111111111111', 'Effect of Grinding Time', 'To investigate the effect of grinding time on particle size reduction using a ball mill.'),
('11111111-1111-1111-1111-111111111111', 'Effect of Grinding Media', 'To compare the efficiency of different grinding media sizes in a ball mill.');


-- Insert Reynolds Apparatus
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('22222222-2222-2222-2222-222222222222', 'fluid-mechanics', 'Flow Analysis', 'Reynolds Apparatus', 
 'Apparatus to visually observe laminar, transitional, and turbulent flow regimes.',
 'Dye is injected into a flowing fluid stream in a glass tube. The behavior of the dye streak determines the flow regime.',
 'Flow rate is controlled via a valve. As velocity increases, the Reynolds number crosses the critical transition value (~2100-2300).');

-- Insert Reynolds Experiments
INSERT INTO public.chembase_experiment_knowledge (equipment_id, name, typical_objective) VALUES 
('22222222-2222-2222-2222-222222222222', 'Determination of Flow Regimes', 'To visually observe flow regimes and calculate the critical Reynolds number.');


-- Insert Shell & Tube Heat Exchanger
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('33333333-3333-3333-3333-333333333333', 'heat-transfer', 'Heat Exchangers', 'Shell & Tube Heat Exchanger', 
 'The most common class of heat exchanger designs. Suited for higher-pressure applications.',
 'Heat is transferred by conduction and convection from a hot fluid to a cold fluid through tube walls.',
 'One fluid flows through the tubes, while another fluid flows over the tubes (through the shell). Can operate in co-current or counter-current flow.');

-- Insert Shell & Tube Experiments
INSERT INTO public.chembase_experiment_knowledge (equipment_id, name, typical_objective) VALUES 
('33333333-3333-3333-3333-333333333333', 'Overall Heat Transfer Coefficient', 'To determine the overall heat transfer coefficient (U) in a shell and tube heat exchanger.');


-- Insert CSTR
INSERT INTO public.chembase_equipment_knowledge 
(id, subject, category, name, description, working_principle, operating_principle) 
VALUES 
('44444444-4444-4444-4444-444444444444', 'reaction-eng', 'Reactors', 'Continuous Stirred Tank Reactor (CSTR)', 
 'A tank reactor in which reactants are continuously fed and products continuously removed, with perfect mixing.',
 'Assumes perfect mixing, so the properties inside the reactor are uniform and identical to the exit stream.',
 'Reactants are fed at a constant volumetric flow rate. The residence time controls the conversion.');

-- Insert CSTR Experiments
INSERT INTO public.chembase_experiment_knowledge (equipment_id, name, typical_objective) VALUES 
('44444444-4444-4444-4444-444444444444', 'Saponification Kinetics', 'To determine the reaction rate constant for the saponification of ethyl acetate with sodium hydroxide in a CSTR.');
