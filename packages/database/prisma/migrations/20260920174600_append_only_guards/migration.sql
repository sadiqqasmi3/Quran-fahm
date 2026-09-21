-- Learning evidence is an append-only event stream. Corrections are new events,
-- never edits that rewrite the learner's history.
CREATE FUNCTION "qf_prevent_learning_event_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'learning_events are append-only';
END;
$$;

CREATE TRIGGER "learning_events_append_only"
BEFORE UPDATE OR DELETE ON "learning_events"
FOR EACH ROW EXECUTE FUNCTION "qf_prevent_learning_event_mutation"();

-- A release may move through workflow statuses, but its source identity,
-- checksums and manifest cannot be edited in place. A correction is a new
-- release that supersedes the previous one.
CREATE FUNCTION "qf_preserve_content_release_identity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'content releases cannot be deleted';
  END IF;

  IF ROW(
    OLD."id",
    OLD."source_id",
    OLD."provider",
    OLD."edition",
    OLD."upstream_version",
    OLD."upstream_commit",
    OLD."sha256",
    OLD."license",
    OLD."retrieved_at",
    OLD."manifest",
    OLD."created_at"
  ) IS DISTINCT FROM ROW(
    NEW."id",
    NEW."source_id",
    NEW."provider",
    NEW."edition",
    NEW."upstream_version",
    NEW."upstream_commit",
    NEW."sha256",
    NEW."license",
    NEW."retrieved_at",
    NEW."manifest",
    NEW."created_at"
  ) THEN
    RAISE EXCEPTION 'published content identity is immutable; create a new release';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "content_release_identity_immutable"
BEFORE UPDATE OR DELETE ON "content_releases"
FOR EACH ROW EXECUTE FUNCTION "qf_preserve_content_release_identity"();
