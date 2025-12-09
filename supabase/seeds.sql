-- Seed data for MyProtocolStack
-- Run this after schema.sql

-- SLEEP PROTOCOLS (8)
INSERT INTO protocols (name, description, category, difficulty, duration_minutes, frequency, science_summary, steps) VALUES
('Morning Sunlight Exposure', 'Get 10-30 minutes of natural light within 1 hour of waking to set your circadian rhythm.', 'sleep', 'easy', 20, 'daily',
'Morning light exposure triggers a cortisol pulse that helps you wake up and sets a timer for melatonin release ~16 hours later. Research shows this is the most powerful tool for regulating sleep-wake cycles.',
ARRAY['Wake up and go outside within 30-60 minutes', 'Face the sun (no sunglasses) for 10-30 minutes', 'Cloudy day? Stay out longer (30+ min)', 'Do this even on weekends']),

('Caffeine Cutoff', 'Stop consuming caffeine at least 8-10 hours before your target bedtime.', 'sleep', 'medium', NULL, 'daily',
'Caffeine has a half-life of 5-6 hours, meaning half is still in your system after that time. Even if you can fall asleep, caffeine reduces deep sleep quality by up to 20%.',
ARRAY['Calculate cutoff time (bedtime - 10 hours)', 'Set a daily alarm as reminder', 'Switch to decaf or herbal tea after cutoff', 'Watch for hidden caffeine (chocolate, some medications)']),

('Blue Light Blocking', 'Reduce blue light exposure 2-3 hours before bed to protect melatonin production.', 'sleep', 'easy', NULL, 'daily',
'Blue wavelengths (450-490nm) suppress melatonin production most effectively. Even brief exposure can delay sleep onset and reduce sleep quality.',
ARRAY['Enable night mode on all devices after sunset', 'Use blue light blocking glasses', 'Dim overhead lights, use warm-toned lamps', 'Avoid screens 1 hour before bed if possible']),

('Temperature Optimization', 'Keep your bedroom between 65-68°F (18-20°C) for optimal sleep.', 'sleep', 'easy', NULL, 'daily',
'Core body temperature needs to drop 2-3°F for sleep initiation. A cool room facilitates this drop and improves both sleep onset and deep sleep quality.',
ARRAY['Set thermostat to 65-68°F (18-20°C)', 'Use breathable bedding materials', 'Consider a cooling mattress pad', 'Take a warm shower 1-2 hours before bed (causes rebound cooling)']),

('Consistent Sleep Schedule', 'Go to bed and wake up at the same time every day, including weekends.', 'sleep', 'hard', NULL, 'daily',
'Your circadian rhythm thrives on consistency. Irregular sleep schedules are associated with worse cardiovascular health, metabolism, and mood.',
ARRAY['Choose a realistic wake time you can maintain', 'Set both a bedtime and wake alarm', 'Keep weekend variation under 1 hour', 'Adjust gradually (15-30 min per day)']),

('Magnesium Before Bed', 'Take 200-400mg of magnesium glycinate or threonate 30-60 minutes before bed.', 'sleep', 'easy', NULL, 'daily',
'Magnesium activates GABA receptors, promoting relaxation. Most people are deficient. Glycinate and threonate forms are better absorbed and gentler on digestion.',
ARRAY['Take 200-400mg magnesium glycinate or threonate', 'Time it 30-60 minutes before bed', 'Start with lower dose, increase if needed', 'Take with a small amount of food']),

('Screen-Free Wind Down', 'Spend the last hour before bed without screens.', 'sleep', 'medium', 60, 'daily',
'Beyond blue light, screens provide stimulating content that activates the brain. A screen-free period allows natural mental wind-down and melatonin release.',
ARRAY['Set a "screens off" alarm 1 hour before bed', 'Prepare relaxing alternatives (books, journaling)', 'Charge devices outside the bedroom', 'Use this time for hygiene routine, stretching, or reading']),

('Evening Walk', 'Take a 10-20 minute walk after dinner to aid digestion and signal day''s end.', 'sleep', 'easy', 15, 'daily',
'Light movement after eating improves glucose response and digestion. Evening walks also provide a psychological transition from day to night mode.',
ARRAY['Walk within 30-60 minutes after dinner', 'Keep it gentle - not exercise', 'Leave phone at home or on silent', '10-20 minutes is sufficient']);

-- FOCUS PROTOCOLS (7)
INSERT INTO protocols (name, description, category, difficulty, duration_minutes, frequency, science_summary, steps) VALUES
('90-Minute Deep Work Blocks', 'Structure focused work in 90-minute cycles aligned with your ultradian rhythm.', 'focus', 'medium', 90, 'daily',
'The brain operates in 90-minute ultradian cycles. Working with these natural rhythms produces better focus than arbitrary time blocks.',
ARRAY['Choose your most important task', 'Set a 90-minute timer', 'Eliminate all distractions', 'Take a 15-20 minute break between cycles', 'Aim for 2-3 deep work blocks per day']),

('Strategic Caffeine Timing', 'Delay morning caffeine 90-120 minutes after waking for optimal effect.', 'focus', 'medium', NULL, 'daily',
'Adenosine (sleepiness chemical) is highest upon waking. Waiting allows natural clearance, then caffeine blocks any residual adenosine for cleaner energy.',
ARRAY['Wait 90-120 minutes after waking for caffeine', 'Drink water first thing instead', 'Get morning light during this window', 'Time caffeine for when you need focus most']),

('Cold Exposure for Alertness', 'Use cold water exposure (face, shower, or immersion) to boost dopamine and alertness.', 'focus', 'hard', 5, 'daily',
'Cold exposure triggers a 200-300% increase in dopamine that lasts 3+ hours. This provides sustained alertness without the crash of caffeine.',
ARRAY['Start with cold water on face/neck', 'Progress to 30-60 seconds cold at end of shower', 'Eventually try 2-5 minutes cold immersion', 'Do in morning for all-day alertness']),

('Movement Breaks', 'Take a 5-10 minute movement break every 90 minutes.', 'focus', 'easy', 10, 'daily',
'Sitting for extended periods reduces blood flow to the brain. Brief movement restores focus, improves mood, and prevents physical tension.',
ARRAY['Set a timer for every 90 minutes', 'Stand, stretch, or walk briefly', 'Do a few jumping jacks or squats', 'Step outside if possible', 'Return to work refreshed']),

('Ultradian Rhythm Work', 'Schedule your most demanding cognitive work during your peak ultradian cycles.', 'focus', 'medium', NULL, 'daily',
'Most people have peak cognitive performance 2-4 hours after waking. Scheduling important work during these windows maximizes output.',
ARRAY['Track your energy levels for a week', 'Identify your peak performance windows', 'Schedule creative/analytical work during peaks', 'Save routine tasks for energy dips']),

('Environment Optimization', 'Design your workspace to minimize distractions and maximize focus.', 'focus', 'easy', NULL, 'weekly',
'Environmental cues significantly impact focus. A dedicated, optimized workspace trains your brain to enter "work mode" automatically.',
ARRAY['Remove phone from sight or use focus mode', 'Use website blockers during deep work', 'Keep desk clear of non-essential items', 'Use noise-canceling headphones or white noise', 'Ensure good lighting (natural if possible)']),

('Phone-Free Focus Blocks', 'Put your phone in another room during focused work sessions.', 'focus', 'medium', NULL, 'daily',
'Even the presence of a smartphone reduces cognitive capacity, even when off. Physical separation eliminates the temptation to check.',
ARRAY['Designate a phone parking spot outside your workspace', 'Set phone to Do Not Disturb', 'Tell important contacts your focus schedule', 'Check phone only during breaks']);

-- ENERGY PROTOCOLS (8)
INSERT INTO protocols (name, description, category, difficulty, duration_minutes, frequency, science_summary, steps) VALUES
('16:8 Intermittent Fasting', 'Eat within an 8-hour window and fast for 16 hours.', 'energy', 'medium', NULL, 'daily',
'Time-restricted eating improves metabolic flexibility, insulin sensitivity, and cellular cleanup (autophagy). Many report more stable energy throughout the day.',
ARRAY['Choose your 8-hour eating window', 'Stop eating 3+ hours before bed', 'Stay hydrated during fasting (water, black coffee, tea)', 'Break fast with protein and healthy fats', 'Start with 12:12 and work up to 16:8']),

('Protein-First Breakfast', 'Consume 30-50g of protein within 1 hour of your first meal.', 'energy', 'easy', NULL, 'daily',
'Protein stabilizes blood sugar, reduces cravings, and supports muscle maintenance. Starting with protein sets up better energy for the day.',
ARRAY['Aim for 30-50g protein at first meal', 'Good sources: eggs, Greek yogurt, meat, fish', 'Prepare protein options in advance', 'Combine with healthy fats and fiber']),

('Blood Sugar Stability', 'Eat to minimize blood sugar spikes throughout the day.', 'energy', 'medium', NULL, 'daily',
'Blood sugar spikes cause energy crashes. Stable blood sugar provides consistent energy, better focus, and reduced cravings.',
ARRAY['Eat protein and fat before carbs', 'Add fiber to every meal', 'Walk for 10-15 min after meals', 'Avoid sugary drinks and processed foods', 'Choose whole grains over refined']),

('Hydration Protocol', 'Drink adequate water throughout the day, starting with 16oz upon waking.', 'energy', 'easy', NULL, 'daily',
'Even mild dehydration (2%) impairs cognitive function and energy. Hydrating first thing replaces overnight losses and kickstarts metabolism.',
ARRAY['Drink 16oz (500ml) water upon waking', 'Aim for half your bodyweight in ounces daily', 'Spread intake throughout the day', 'Add electrolytes if very active', 'Monitor urine color (pale yellow = good)']),

('Seed Oil Elimination', 'Avoid industrial seed oils (canola, soybean, corn, sunflower, safflower).', 'energy', 'hard', NULL, 'daily',
'Seed oils are high in omega-6 fatty acids, which promote inflammation when consumed in excess. Many report improved energy and reduced inflammation.',
ARRAY['Read ingredient labels carefully', 'Cook with olive oil, avocado oil, butter, or coconut oil', 'Avoid fried restaurant food', 'Choose whole foods over processed', 'Make your own salad dressings']),

('Afternoon Sunlight', 'Get 10-20 minutes of afternoon/evening sunlight to support circadian rhythm.', 'energy', 'easy', 15, 'daily',
'Afternoon light exposure helps your body anticipate nightfall and supports the natural cortisol-to-melatonin transition for better sleep.',
ARRAY['Go outside in late afternoon (3-6 PM)', 'Even overcast light is beneficial', 'Combine with a short walk', 'No sunglasses for maximum effect']),

('Power Nap Protocol', 'Take a 10-20 minute nap before 3 PM if needed for energy restoration.', 'energy', 'easy', 20, 'daily',
'Short naps restore alertness without entering deep sleep, which causes grogginess. Napping before 3 PM prevents interference with nighttime sleep.',
ARRAY['Nap between 1-3 PM if possible', 'Keep it to 10-20 minutes', 'Set an alarm to prevent oversleeping', 'Find a quiet, dark place', 'Consider a "nappuccino" (caffeine before nap)']),

('Evening Meal Timing', 'Finish eating 3+ hours before bedtime for better sleep and energy.', 'energy', 'medium', NULL, 'daily',
'Late eating disrupts sleep quality and glucose regulation. Finishing early allows digestion to complete before sleep.',
ARRAY['Calculate your meal cutoff time', 'Plan dinner timing accordingly', 'If hungry, choose light protein snack', 'Stay hydrated but reduce liquids before bed']);

-- FITNESS PROTOCOLS (7)
INSERT INTO protocols (name, description, category, difficulty, duration_minutes, frequency, science_summary, steps) VALUES
('Zone 2 Cardio', 'Perform 150-180 minutes per week of low-intensity aerobic exercise.', 'fitness', 'medium', 45, 'weekly',
'Zone 2 training builds mitochondrial density and fat oxidation capacity. It''s the foundation of metabolic health and supports all other training.',
ARRAY['Calculate Zone 2 heart rate (roughly 180 minus age)', 'Choose: walking, cycling, swimming, rowing', 'Maintain conversational pace', 'Aim for 3-4 sessions of 30-45 minutes', 'Can be done daily without recovery concerns']),

('Resistance Training', 'Lift weights or do bodyweight training 2-4 times per week.', 'fitness', 'medium', 45, 'weekly',
'Resistance training is the most effective intervention for maintaining muscle mass, bone density, and metabolic health as we age.',
ARRAY['Train 2-4 times per week', 'Focus on compound movements', 'Progressively increase weight or reps', 'Allow 48 hours recovery per muscle group', 'Prioritize form over weight']),

('Daily Walking', 'Accumulate 7,000-10,000 steps throughout the day.', 'fitness', 'easy', NULL, 'daily',
'Walking is the most underrated exercise. Research shows 7,000-10,000 daily steps significantly reduces all-cause mortality and improves metabolic health.',
ARRAY['Track steps with phone or watch', 'Take walking meetings when possible', 'Park farther away', 'Use stairs instead of elevator', 'Take a post-meal walk']),

('Deliberate Cold/Heat Exposure', 'Use sauna and/or cold exposure for recovery and adaptation.', 'fitness', 'hard', 20, 'weekly',
'Heat exposure (sauna) increases growth hormone and improves cardiovascular function. Cold exposure reduces inflammation and builds resilience.',
ARRAY['Sauna: 15-20 min at 170-200°F, 2-4x/week', 'Cold: 2-5 min cold immersion, 2-4x/week', 'End workouts with cold for recovery', 'Use sauna on rest days for growth hormone', 'Stay hydrated']),

('Daily Mobility Routine', 'Spend 10-15 minutes daily on stretching and mobility work.', 'fitness', 'easy', 15, 'daily',
'Mobility work prevents injury, improves movement quality, and reduces chronic tension. Consistency matters more than duration.',
ARRAY['Choose 5-10 movements targeting tight areas', 'Hold stretches for 30-60 seconds', 'Include hip, shoulder, and spine work', 'Do before bed or first thing in morning', 'Can combine with other activities (TV, calls)']),

('Active Recovery', 'Take dedicated recovery days with light movement instead of complete rest.', 'fitness', 'easy', 30, 'weekly',
'Active recovery promotes blood flow for faster recovery while preventing the stiffness of complete rest. Quality recovery enables quality training.',
ARRAY['Schedule 1-2 active recovery days per week', 'Light activities: walking, swimming, yoga', 'Keep heart rate low', 'Focus on areas that are tight or sore', 'Prioritize sleep on recovery days']),

('Progressive Overload Tracking', 'Track workouts and systematically increase difficulty over time.', 'fitness', 'medium', NULL, 'weekly',
'Progressive overload is the fundamental principle of adaptation. Without tracking, it''s easy to plateau or overtrain.',
ARRAY['Use an app or notebook to track workouts', 'Record weight, reps, sets, and RPE', 'Increase by small increments (2.5-5%)', 'Review progress weekly', 'Deload every 4-6 weeks']);
