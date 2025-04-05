--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aged_care_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aged_care_providers (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    address character varying(255) NOT NULL,
    phone character varying(255),
    latitude double precision,
    longitude double precision,
    services character varying(255)[],
    care_types character varying(255)[],
    distance double precision,
    image_url character varying(255),
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: aged_care_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aged_care_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aged_care_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aged_care_providers_id_seq OWNED BY public.aged_care_providers.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: aged_care_providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aged_care_providers ALTER COLUMN id SET DEFAULT nextval('public.aged_care_providers_id_seq'::regclass);


--
-- Name: aged_care_providers aged_care_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aged_care_providers
    ADD CONSTRAINT aged_care_providers_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: aged_care_providers_latitude_longitude_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aged_care_providers_latitude_longitude_index ON public.aged_care_providers USING btree (latitude, longitude);


--
-- PostgreSQL database dump complete
--

INSERT INTO public."schema_migrations" (version) VALUES (20240404);
