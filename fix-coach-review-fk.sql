-- Coach review tablosundaki eski Coach foreign key constraint'ini kaldır
ALTER TABLE coach_review DROP CONSTRAINT IF EXISTS "FK_812affe9ccfae5b4f97e624309a";

-- Eski constraint varsa temizle
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- coach_review tablosundaki tüm coachId ile ilgili foreign key'leri bul
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'coach_review'
          AND kcu.column_name = 'coachId'
          AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE coach_review DROP CONSTRAINT IF EXISTS "' || constraint_name || '"';
    END LOOP;
END $$;

-- Artık coachId User tablosundaki coach'lara referans veriyor (soft reference, FK yok)
