# Frontend Technical Challenge — Angular 17+

This is a project for a Front-End (Angular) technical assessment to Attus Company.

---

## Tech Stack

- Angular 17
- Angular Material
- RxJS
- Signals for state management
- Jest for unit test
- TypeScript

---

## You will need

- Node.js **20.x**
- npm **9+**
- Angular CLI

---

## ▶️ Running the Application

```bash
# installing all dependencies
npm install

# how to run it:
ng serve
```

As soon as you run `ng serve` app will be available at:

```
http://localhost:4200
```

---

## Running Tests

```bash
npm run test
```

---

## ✨ Features

- User listing with card layout
- Search by name with debounce (300ms)
- Loading state handling
- Error handling
- Create and edit user via modal
- Reactive forms with validation
- Disabled submit button when form is invalid

---

## Architecture

The project follows a **feature-based architecture**:

```
src/app/
 ├── core/        # global services and interceptors
 ├── shared/      # reusable components and utilities
 └── features/
      └── users/
           ├── data-access   # services and state management
           ├── ui            # presentational components
           ├── pages         # smart/container components
           └── models        # TypeScript interfaces
```

---

## Technical Decisions

### State Management

Angular **Signals** were used for local state management due to:

- Simplicity
- Better readability
- Modern Angular approach

NgRx was implemented separately as required by the challenge.

---

### RxJS

Used for:

- Debouncing user input (`debounceTime`)
- Handling async flows (`switchMap`)
- Error handling (`catchError`)

---

### Performance

- `ChangeDetectionStrategy.OnPush`
- `trackBy` for list rendering optimization
- `async pipe` to avoid manual subscriptions

---

### Memory Management

- `takeUntilDestroyed`
- `async pipe`

Avoiding memory leaks across the application.

---

## Testing

- Unit tests implemented using Jest
- Test coverage above 60%
- Focus on services and components

---

## Improvements

- Pagination
- Improve input masking with CPF, phone
- API integration with a real backend
- Monorepo structure using Nx

---

## 📎 Repository

> https://github.com/robertogalbiatti/desafio_frontend_attus

---

## THANK YOU!
