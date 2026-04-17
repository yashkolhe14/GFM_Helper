-- ConsulPredict Snowflake Setup
-- Account: BI24418.central-india.azure
-- Run as: SYSADMIN

-- Source DB (incident history synced from ServiceNow)
CREATE DATABASE IF NOT EXISTS ITSM_DB;
USE DATABASE ITSM_DB;
CREATE SCHEMA IF NOT EXISTS INCIDENT_ANALYTICS;
USE SCHEMA INCIDENT_ANALYTICS;

CREATE TABLE IF NOT EXISTS INCIDENT_HISTORY (
    sys_id                  STRING    NOT NULL,
    incident_id             STRING,
    ci_id                   STRING,
    ci_name                 STRING,
    short_description       STRING,
    category                STRING,
    priority                INTEGER,
    state                   STRING,
    assignment_group        STRING,
    opened_at               TIMESTAMP_NTZ,
    resolved_at             TIMESTAMP_NTZ,
    resolution_time_minutes INTEGER,
    sla_breached            BOOLEAN,
    day_of_week             STRING,
    hour_of_day             INTEGER,
    sync_date               TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

ALTER TABLE INCIDENT_HISTORY CLUSTER BY (ci_id, opened_at);

CREATE OR REPLACE VIEW CI_INCIDENT_AGG AS
SELECT
    ci_id,
    COUNT(CASE WHEN opened_at >= DATEADD(hour, -24, CURRENT_TIMESTAMP()) THEN 1 END) AS frequency_24h,
    COUNT(CASE WHEN opened_at >= DATEADD(day, -7, CURRENT_TIMESTAMP()) THEN 1 END)   AS frequency_7d,
    AVG(resolution_time_minutes)                                                       AS avg_resolution_time,
    MAX(opened_at)                                                                     AS last_incident_at
FROM INCIDENT_HISTORY
GROUP BY ci_id;

-- Log DB (prediction outputs)
CREATE DATABASE IF NOT EXISTS CONSUL_PREDICT;
USE DATABASE CONSUL_PREDICT;
USE SCHEMA PUBLIC;

CREATE TABLE IF NOT EXISTS PREDICTION_LOG (
    id                  STRING    NOT NULL DEFAULT UUID_STRING(),
    ci                  STRING,
    risk_score          FLOAT,
    risk_level          STRING,
    deterministic_score FLOAT,
    ai_adjustment       FLOAT,
    confidence          FLOAT,
    reason              STRING,
    recommended_action  STRING,
    trend               STRING,
    spike               INTEGER,
    mode                STRING,
    payload             VARIANT,
    created_at          TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

ALTER TABLE PREDICTION_LOG CLUSTER BY (ci, created_at);

-- Warehouse
CREATE WAREHOUSE IF NOT EXISTS COMPUTE_WH
    WAREHOUSE_SIZE = 'X-SMALL' AUTO_SUSPEND = 60 AUTO_RESUME = TRUE;

-- Service account
CREATE USER IF NOT EXISTS consul_predict_svc
    DEFAULT_WAREHOUSE = COMPUTE_WH
    DEFAULT_NAMESPACE = 'ITSM_DB.INCIDENT_ANALYTICS';

GRANT USAGE ON DATABASE ITSM_DB TO USER consul_predict_svc;
GRANT USAGE ON SCHEMA ITSM_DB.INCIDENT_ANALYTICS TO USER consul_predict_svc;
GRANT SELECT ON ALL TABLES IN SCHEMA ITSM_DB.INCIDENT_ANALYTICS TO USER consul_predict_svc;
GRANT SELECT ON ALL VIEWS IN SCHEMA ITSM_DB.INCIDENT_ANALYTICS TO USER consul_predict_svc;
GRANT INSERT, UPDATE, MERGE ON TABLE ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY TO USER consul_predict_svc;
GRANT CREATE VIEW ON SCHEMA ITSM_DB.INCIDENT_ANALYTICS TO USER consul_predict_svc;
GRANT USAGE ON DATABASE CONSUL_PREDICT TO USER consul_predict_svc;
GRANT USAGE ON SCHEMA CONSUL_PREDICT.PUBLIC TO USER consul_predict_svc;
GRANT INSERT, SELECT ON TABLE CONSUL_PREDICT.PUBLIC.PREDICTION_LOG TO USER consul_predict_svc;
GRANT CREATE TABLE ON SCHEMA CONSUL_PREDICT.PUBLIC TO USER consul_predict_svc;
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO USER consul_predict_svc;

-- Validate
SELECT COUNT(*) FROM ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY;
SELECT COUNT(*) FROM CONSUL_PREDICT.PUBLIC.PREDICTION_LOG;
