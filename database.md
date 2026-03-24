-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.allowed_signup_domains (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  apex_domain character varying NOT NULL UNIQUE,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT allowed_signup_domains_pkey PRIMARY KEY (id),
  CONSTRAINT allowed_signup_domains_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT allowed_signup_domains_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bug_reports (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  subject character varying,
  message text,
  profile_id uuid,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT bug_reports_pkey PRIMARY KEY (id),
  CONSTRAINT bug_reports_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT bug_reports_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT bug_reports_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.caption_examples (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  image_description text NOT NULL,
  caption text NOT NULL,
  explanation text NOT NULL,
  priority smallint NOT NULL DEFAULT '0'::smallint,
  image_id uuid,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT caption_examples_pkey PRIMARY KEY (id),
  CONSTRAINT caption_examples_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT caption_examples_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_examples_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.caption_likes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid NOT NULL,
  caption_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT caption_likes_pkey PRIMARY KEY (id),
  CONSTRAINT caption_likes_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT caption_likes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_likes_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_likes_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.caption_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid NOT NULL,
  image_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT caption_requests_pkey PRIMARY KEY (id),
  CONSTRAINT caption_requests_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT caption_requests_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_requests_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_requests_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.caption_saved (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid NOT NULL,
  caption_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT caption_saved_pkey PRIMARY KEY (id),
  CONSTRAINT caption_saved_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT caption_saved_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_saved_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_saved_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.caption_votes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  vote_value smallint NOT NULL,
  profile_id uuid NOT NULL,
  caption_id uuid NOT NULL,
  user_id uuid,
  value smallint,
  created_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT caption_votes_pkey PRIMARY KEY (id),
  CONSTRAINT caption_votes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_votes_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT caption_votes_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT caption_votes_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.captions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  content character varying,
  is_public boolean NOT NULL,
  profile_id uuid NOT NULL,
  image_id uuid NOT NULL,
  humor_flavor_id bigint,
  is_featured boolean NOT NULL DEFAULT false,
  caption_request_id bigint,
  like_count bigint NOT NULL DEFAULT '0'::bigint,
  llm_prompt_chain_id bigint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT captions_pkey PRIMARY KEY (id),
  CONSTRAINT captions_caption_request_id_fkey FOREIGN KEY (caption_request_id) REFERENCES public.caption_requests(id),
  CONSTRAINT captions_humor_flavor_id_fkey FOREIGN KEY (humor_flavor_id) REFERENCES public.humor_flavors(id),
  CONSTRAINT captions_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT captions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT captions_llm_prompt_chain_id_fkey FOREIGN KEY (llm_prompt_chain_id) REFERENCES public.llm_prompt_chains(id),
  CONSTRAINT captions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT captions_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.common_use_categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT common_use_categories_pkey PRIMARY KEY (id),
  CONSTRAINT common_use_categories_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT common_use_categories_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.common_use_category_image_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  image_id uuid,
  common_use_category_id bigint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT common_use_category_image_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT common_use_category_image_mappings_common_use_category_id_fkey FOREIGN KEY (common_use_category_id) REFERENCES public.common_use_categories(id),
  CONSTRAINT common_use_category_image_mappings_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT common_use_category_image_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT common_use_category_image_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.communities (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT communities_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_context_tag_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  community_context_id bigint NOT NULL,
  community_context_tag_id integer NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_context_tag_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT community_context_tag_mappings_community_context_id_fkey FOREIGN KEY (community_context_id) REFERENCES public.community_contexts(id),
  CONSTRAINT community_context_tag_mappings_community_context_tag_id_fkey FOREIGN KEY (community_context_tag_id) REFERENCES public.community_context_tags(id),
  CONSTRAINT community_context_tag_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_context_tag_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_context_tags (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_context_tags_pkey PRIMARY KEY (id),
  CONSTRAINT community_context_tags_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_context_tags_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_contexts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  content text,
  community_id smallint,
  start_datetime_utc timestamp without time zone,
  end_datetime_utc timestamp without time zone,
  priority smallint,
  embedding USER-DEFINED,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT community_contexts_pkey PRIMARY KEY (id),
  CONSTRAINT community_contexts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_contexts_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_contexts_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dorms (
  id integer NOT NULL DEFAULT nextval('dorms_id_seq'::regclass),
  university_id integer NOT NULL,
  short_name character varying NOT NULL,
  full_name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dorms_pkey PRIMARY KEY (id),
  CONSTRAINT dorms_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT dorms_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT dorms_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_flavor_mix (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  humor_flavor_id bigint NOT NULL,
  caption_count smallint NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_flavor_mix_pkey PRIMARY KEY (id),
  CONSTRAINT humor_flavor_mix_humor_flavor_id_fkey FOREIGN KEY (humor_flavor_id) REFERENCES public.humor_flavors(id),
  CONSTRAINT humor_flavor_mix_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_flavor_mix_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_flavor_step_types (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  slug character varying NOT NULL,
  description text NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_flavor_step_types_pkey PRIMARY KEY (id),
  CONSTRAINT humor_flavor_step_types_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_flavor_step_types_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_flavor_steps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  humor_flavor_id bigint NOT NULL,
  llm_temperature numeric,
  order_by smallint NOT NULL,
  llm_input_type_id smallint NOT NULL,
  llm_output_type_id smallint NOT NULL,
  llm_model_id smallint NOT NULL,
  humor_flavor_step_type_id smallint NOT NULL,
  llm_system_prompt text,
  llm_user_prompt text,
  description character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_flavor_steps_pkey PRIMARY KEY (id),
  CONSTRAINT humor_flavor_steps_llm_input_type_id_fkey FOREIGN KEY (llm_input_type_id) REFERENCES public.llm_input_types(id),
  CONSTRAINT humor_flavor_steps_llm_model_id_fkey FOREIGN KEY (llm_model_id) REFERENCES public.llm_models(id),
  CONSTRAINT humor_flavor_steps_llm_output_type_id_fkey FOREIGN KEY (llm_output_type_id) REFERENCES public.llm_output_types(id),
  CONSTRAINT humor_flavor_steps_humor_flavor_step_id_fkey FOREIGN KEY (humor_flavor_step_type_id) REFERENCES public.humor_flavor_step_types(id),
  CONSTRAINT humor_flavor_steps_humor_flavor_id_fkey FOREIGN KEY (humor_flavor_id) REFERENCES public.humor_flavors(id),
  CONSTRAINT humor_flavor_steps_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_flavor_steps_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_flavor_theme_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  humor_flavor_id bigint,
  humor_theme_id bigint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_flavor_theme_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT humor_flavor_theme_mappings_humor_flavor_id_fkey FOREIGN KEY (humor_flavor_id) REFERENCES public.humor_flavors(id),
  CONSTRAINT humor_flavor_theme_mappings_humor_theme_id_fkey FOREIGN KEY (humor_theme_id) REFERENCES public.humor_themes(id),
  CONSTRAINT humor_flavor_theme_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_flavor_theme_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_flavors (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  slug character varying NOT NULL UNIQUE,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_flavors_pkey PRIMARY KEY (id),
  CONSTRAINT humor_flavors_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_flavors_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.humor_themes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  description text,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT humor_themes_pkey PRIMARY KEY (id),
  CONSTRAINT humor_themes_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT humor_themes_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  url character varying,
  is_common_use boolean DEFAULT false,
  profile_id uuid DEFAULT auth.uid(),
  additional_context character varying,
  is_public boolean DEFAULT false,
  image_description text,
  celebrity_recognition text,
  embedding USER-DEFINED,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT images_pkey PRIMARY KEY (id),
  CONSTRAINT images_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT images_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT images_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.invitations (
  id integer NOT NULL DEFAULT nextval('invitations_id_seq'::regclass),
  invitee_email character varying NOT NULL,
  inviter_id uuid,
  invitation_token character varying NOT NULL UNIQUE,
  is_accepted boolean DEFAULT false,
  expires_datetime_utc timestamp without time zone DEFAULT (now() + '7 days'::interval),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id),
  CONSTRAINT invitations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT invitations_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.link_redirects (
  id integer NOT NULL DEFAULT nextval('link_redirects_id_seq'::regclass),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  destination_url text NOT NULL,
  visit_count integer NOT NULL DEFAULT 0,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  folder_path character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT link_redirects_pkey PRIMARY KEY (id),
  CONSTRAINT link_redirects_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT link_redirects_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_input_types (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  description character varying NOT NULL,
  slug character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_input_types_pkey PRIMARY KEY (id),
  CONSTRAINT llm_input_types_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_input_types_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_model_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  llm_model_response text,
  processing_time_seconds smallint NOT NULL,
  llm_model_id smallint NOT NULL,
  profile_id uuid NOT NULL,
  caption_request_id bigint NOT NULL,
  llm_system_prompt text NOT NULL,
  llm_user_prompt text NOT NULL,
  llm_temperature numeric,
  humor_flavor_id bigint NOT NULL,
  llm_prompt_chain_id bigint,
  humor_flavor_step_id bigint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_model_responses_pkey PRIMARY KEY (id),
  CONSTRAINT llm_model_responses_caption_request_id_fkey FOREIGN KEY (caption_request_id) REFERENCES public.caption_requests(id),
  CONSTRAINT llm_model_responses_llm_model_id_fkey FOREIGN KEY (llm_model_id) REFERENCES public.llm_models(id),
  CONSTRAINT llm_model_responses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_model_responses_humor_flavor_id_fkey FOREIGN KEY (humor_flavor_id) REFERENCES public.humor_flavors(id),
  CONSTRAINT llm_model_responses_llm_prompt_chain_id_fkey FOREIGN KEY (llm_prompt_chain_id) REFERENCES public.llm_prompt_chains(id),
  CONSTRAINT llm_model_responses_humor_flavor_step_id_fkey FOREIGN KEY (humor_flavor_step_id) REFERENCES public.humor_flavor_steps(id),
  CONSTRAINT llm_model_responses_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_model_responses_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_models (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  llm_provider_id smallint NOT NULL,
  provider_model_id character varying NOT NULL,
  is_temperature_supported boolean NOT NULL DEFAULT false,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_models_pkey PRIMARY KEY (id),
  CONSTRAINT llm_models_llm_provider_id_fkey FOREIGN KEY (llm_provider_id) REFERENCES public.llm_providers(id),
  CONSTRAINT llm_models_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_models_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_output_types (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  description character varying NOT NULL,
  slug character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_output_types_pkey PRIMARY KEY (id),
  CONSTRAINT llm_output_types_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_output_types_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_prompt_chains (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  caption_request_id bigint NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_prompt_chains_pkey PRIMARY KEY (id),
  CONSTRAINT llm_prompt_chains_caption_request_id_fkey FOREIGN KEY (caption_request_id) REFERENCES public.caption_requests(id),
  CONSTRAINT llm_prompt_chains_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_prompt_chains_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llm_providers (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_providers_pkey PRIMARY KEY (id),
  CONSTRAINT llm_providers_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT llm_providers_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.news_entities (
  id integer NOT NULL DEFAULT nextval('news_entities_id_seq'::regclass),
  news_id integer,
  entity text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['person'::text, 'org'::text, 'place'::text, 'event'::text, 'product'::text, 'acronym'::text])),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT news_entities_pkey PRIMARY KEY (id),
  CONSTRAINT news_entities_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news_snippets(id),
  CONSTRAINT news_entities_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT news_entities_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.news_snippets (
  id integer NOT NULL DEFAULT nextval('news_snippets_id_seq'::regclass),
  headline text NOT NULL,
  category text NOT NULL,
  source_url text,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT news_snippets_pkey PRIMARY KEY (id),
  CONSTRAINT news_snippets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT news_snippets_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.personalities (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT personalities_pkey PRIMARY KEY (id),
  CONSTRAINT personalities_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT personalities_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_dorm_mappings (
  id integer NOT NULL DEFAULT nextval('profile_dorm_mappings_id_seq'::regclass),
  profile_id uuid NOT NULL,
  dorm_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_dorm_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT profile_dorm_mappings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_dorm_mappings_dorm_id_fkey FOREIGN KEY (dorm_id) REFERENCES public.dorms(id),
  CONSTRAINT profile_dorm_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_dorm_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_university_major_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  university_major_id integer,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_university_major_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT profile_university_major_mappings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_university_major_mappings_university_major_id_fkey FOREIGN KEY (university_major_id) REFERENCES public.university_major_mappings(id),
  CONSTRAINT profile_university_major_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_university_major_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_university_mappings (
  id integer NOT NULL DEFAULT nextval('profile_university_mappings_id_seq'::regclass),
  profile_id uuid NOT NULL,
  university_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_university_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT profile_university_mappings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_university_mappings_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT profile_university_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_university_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  first_name character varying,
  last_name character varying,
  email text,
  is_superadmin boolean NOT NULL DEFAULT true,
  is_in_study boolean NOT NULL DEFAULT false,
  is_matrix_admin boolean NOT NULL DEFAULT false,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT profiles_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reported_captions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  caption_id uuid,
  profile_id uuid,
  reason text,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reported_captions_pkey PRIMARY KEY (id),
  CONSTRAINT reported_captions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT reported_captions_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT reported_captions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT reported_captions_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reported_images (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  image_id uuid,
  profile_id uuid,
  reason text,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reported_images_pkey PRIMARY KEY (id),
  CONSTRAINT reported_images_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT reported_images_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT reported_images_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT reported_images_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.screenshots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  caption_id uuid,
  profile_id uuid,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT screenshots_pkey PRIMARY KEY (id),
  CONSTRAINT screenshots_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT screenshots_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT screenshots_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT screenshots_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.share_to_destinations (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT share_to_destinations_pkey PRIMARY KEY (id),
  CONSTRAINT share_to_destinations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT share_to_destinations_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.shares (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid,
  share_to_destination_id smallint,
  proper_destination character varying,
  caption_id uuid,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id),
  CONSTRAINT shares_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT shares_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT shares_share_to_destination_id_fkey FOREIGN KEY (share_to_destination_id) REFERENCES public.share_to_destinations(id),
  CONSTRAINT shares_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT shares_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.sidechat_posts (
  id uuid NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  content text,
  post_datetime_utc timestamp with time zone NOT NULL,
  like_count smallint NOT NULL DEFAULT '0'::smallint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sidechat_posts_pkey PRIMARY KEY (id),
  CONSTRAINT sidechat_posts_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT sidechat_posts_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.studies (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  slug character varying,
  description text,
  start_datetime_utc timestamp with time zone,
  end_datetime_utc timestamp with time zone,
  is_hidden boolean NOT NULL DEFAULT false,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT studies_pkey PRIMARY KEY (id),
  CONSTRAINT studies_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT studies_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.study_caption_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  study_id bigint NOT NULL,
  caption_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_caption_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT study_caption_mappings_caption_id_fkey FOREIGN KEY (caption_id) REFERENCES public.captions(id),
  CONSTRAINT study_caption_mappings_study_id_fkey FOREIGN KEY (study_id) REFERENCES public.studies(id),
  CONSTRAINT study_caption_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT study_caption_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.study_image_set_image_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  study_image_set_id bigint NOT NULL,
  image_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_image_set_image_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT study_image_set_image_mappings_study_image_set_id_fkey FOREIGN KEY (study_image_set_id) REFERENCES public.study_image_sets(id),
  CONSTRAINT study_image_set_image_mappings_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id),
  CONSTRAINT study_image_set_image_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT study_image_set_image_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.study_image_sets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  slug character varying NOT NULL,
  description text,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT study_image_sets_pkey PRIMARY KEY (id),
  CONSTRAINT study_image_sets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT study_image_sets_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.term_types (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT term_types_pkey PRIMARY KEY (id),
  CONSTRAINT term_types_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT term_types_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.terms (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  term character varying NOT NULL,
  definition text NOT NULL,
  example text NOT NULL,
  priority smallint NOT NULL DEFAULT '0'::smallint,
  term_type_id smallint,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT terms_pkey PRIMARY KEY (id),
  CONSTRAINT terms_term_type_id_fkey FOREIGN KEY (term_type_id) REFERENCES public.term_types(id),
  CONSTRAINT terms_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT terms_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.testflight_errors (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  error character varying,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT testflight_errors_pkey PRIMARY KEY (id),
  CONSTRAINT testflight_errors_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT testflight_errors_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.transcript_personality_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  personality_id smallint NOT NULL,
  transcript_id bigint NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transcript_personality_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT transcript_personality_mappings_personality_id_fkey FOREIGN KEY (personality_id) REFERENCES public.personalities(id),
  CONSTRAINT transcript_personality_mappings_transcript_id_fkey FOREIGN KEY (transcript_id) REFERENCES public.transcripts(id),
  CONSTRAINT transcript_personality_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT transcript_personality_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.transcripts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  content text NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT transcripts_pkey PRIMARY KEY (id),
  CONSTRAINT transcripts_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT transcripts_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.universities (
  id integer NOT NULL DEFAULT nextval('universities_id_seq'::regclass),
  name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT universities_pkey PRIMARY KEY (id),
  CONSTRAINT universities_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT universities_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.university_major_mappings (
  university_id integer NOT NULL,
  id integer NOT NULL,
  major_id integer,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT university_major_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT university_major_mappings_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT university_major_mappings_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.university_majors(id),
  CONSTRAINT university_major_mappings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT university_major_mappings_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.university_majors (
  name text NOT NULL UNIQUE,
  id integer NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT university_majors_pkey PRIMARY KEY (id),
  CONSTRAINT university_majors_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT university_majors_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.whitelist_email_addresses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  modified_datetime_utc timestamp with time zone NOT NULL DEFAULT now(),
  email_address character varying NOT NULL,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  modified_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT whitelist_email_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT whitelist_email_addresses_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT whitelist_email_addresses_modified_by_user_id_fkey FOREIGN KEY (modified_by_user_id) REFERENCES public.profiles(id)
);