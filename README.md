# TechSupport — Workflow Management App

A mobile app for managing a technical support workflow, built with **React Native (Expo SDK 57)**. It follows a ticket lifecycle across three roles: Support, Branch Manager, and Field Service Engineer (FSE).

## Features

- **Support Desk** — create tickets, search/filter, add notes, close via phone/remote
- **Branch Manager** — approve for assessment, escalate to onsite, place on hold, schedule & assign FSE
- **Field Engineer (FSE)** — view assigned tickets, start onsite service, mark done or pending
- Modern UI with role-based color themes, status pills, and activity timelines
- Runs fully offline in demo mode (in-memory data, no backend required)

## Tech Stack

- Expo SDK 57 / React Native 0.86
- React Navigation (native stack)
- @expo/vector-icons (Ionicons)
- Context API for auth and ticket state

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (SDK 57), or press `w` to open in a web browser.

## Demo Accounts

| Role            | Email              | Password |
| --------------- | ------------------ | -------- |
| Support         | support@demo.com   | demo123  |
| Branch Manager  | manager@demo.com   | demo123  |
| Field Engineer  | fse@demo.com       | demo123  |

## Ticket Workflow

```
Client Report → Ticket Creation → Accounting Approval → Technical Assessment
   → (Phone/Remote Done → Closed)  or  (Escalate → Schedule & Assign FSE)
   → Onsite Service → Service Done → Closed   or   Service Pending → follow-up
```

## Project Structure

```
src/
  context/       Auth & Ticket providers (in-memory demo data)
  navigation/    Role-based stack navigator
  screens/
    auth/          Login
    support/       Dashboard, Create Ticket, Ticket Detail
    branchmanager/ Dashboard, Ticket Detail (approve/escalate/assign)
    fse/           Dashboard, Ticket Detail (onsite service)
  theme.js       Design tokens (colors, spacing, radius, shadow)
  utils/         Ticket status helpers
```
