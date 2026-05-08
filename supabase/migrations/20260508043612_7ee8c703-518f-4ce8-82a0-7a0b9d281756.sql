UPDATE project_phases SET
  title = regexp_replace(title, '[^\x00-\x7F]+', '', 'g'),
  subtitle = regexp_replace(subtitle, '[^\x00-\x7F]+', '', 'g'),
  tasks = regexp_replace(tasks::text, '[^\x00-\x7F]+', '', 'g')::jsonb,
  outputs = regexp_replace(outputs::text, '[^\x00-\x7F]+', '', 'g')::jsonb,
  gate_criteria = regexp_replace(gate_criteria::text, '[^\x00-\x7F]+', '', 'g')::jsonb
WHERE project_id = 'b89ff93f-e6e7-411a-a99c-cc9a2a61c2fb';