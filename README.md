# GNX Lead Automation System

An end-to-end AI-powered lead generation and qualification system that scrapes Google Maps for business leads and automatically qualifies them based on website technology stack.

## 🚀 Overview

This system demonstrates production-ready AI automation by combining web scraping, automated decision-making, and scalable data processing. Built for real-world business use, it processes leads from Google Maps and uses intelligent qualification to identify WordPress-powered websites.

**Key Features:**
- **Automated Lead Generation**: Scrapes Google Maps for business data
- **AI-Powered Qualification**: Automatically detects WordPress websites
- **Production-Ready Architecture**: Containerized microservices with health monitoring
- **Scalable Processing**: Sequential processing prevents system overload
- **User-Friendly Interface**: Web form interface for non-technical users

## 🏗️ Architecture

The system uses a **decoupled microservices architecture**:

1. **Custom Puppeteer API**: Handles web scraping and site analysis
2. **n8n Workflows**: Orchestrates the automation pipeline  
3. **Google Sheets**: Acts as both trigger and data storage
4. **Docker Compose**: Manages service orchestration

```mermaid
graph TD
    A[Web Form] --> B[n8n Workflow 1]
    B --> C[Puppeteer API /scrape]
    C --> D[Google Sheets]
    D --> E[n8n Workflow 2]
    E --> F[Puppeteer API /check-site]
    F --> G[Updated Google Sheets]
