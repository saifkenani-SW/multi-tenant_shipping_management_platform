# Software Requirements Specification (SRS)

## Multi-Tenant Shipping Management Platform

### Document Control
- **Version:** 1.0
- **Date:** 2026-07-16
- **Author:** Saif

## 1. Introduction

### 1.1 Purpose
This document outlines the functional and non-functional requirements for the Multi-Tenant Shipping Management Platform.

### 1.2 Scope
A cloud-based platform that enables multiple tenants (shipping companies, freight forwarders) to manage their shipping operations independently.

### 1.3 Definitions & Acronyms
See [GLOSSARY.md](./GLOSSARY.md)

## 2. Overall Description

### 2.1 Product Perspective
The system is a modular monolith (NestJS) with separate frontend (React) and mobile (React Native) applications.

### 2.2 User Classes
- **System Admin:** Full platform administration
- **Tenant Admin:** Manages organization settings
- **Dispatcher:** Creates and assigns shipments
- **Driver:** Accepts and delivers shipments
- **Customer:** Tracks shipments

## 3. Requirements

### 3.1 Functional Requirements
[To be detailed]

### 3.2 Non-Functional Requirements
- Multi-tenancy isolation
- Real-time tracking
- 99.9% uptime SLA
