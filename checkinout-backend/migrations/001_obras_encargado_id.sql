-- Relación obra ↔ encargado (inspector SST ya usa responsable_sst_id).
ALTER TABLE obras
  ADD COLUMN encargado_id INT NULL AFTER responsable_sst_id,
  ADD CONSTRAINT fk_obras_encargado FOREIGN KEY (encargado_id) REFERENCES usuarios(id) ON DELETE SET NULL;
