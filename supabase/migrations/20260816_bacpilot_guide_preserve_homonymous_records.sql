-- BacPilot — préservation des lignes sources du guide.
-- Une même page peut présenter des formations homonymes lorsque l’établissement est absent
-- dans l’extraction textuelle. record_id reste la clé primaire ; aucune ligne source n’est fusionnée.

ALTER TABLE public.guide_programmes
  DROP CONSTRAINT IF EXISTS guide_programmes_source_id_source_pdf_page_programme_normal_key;
