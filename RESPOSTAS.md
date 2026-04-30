# Answers — Front End Angular Technical Assessment

---

## 1. TypeScript and Code Quality

### 1.1 Refactoring

**Problems identified:**

- `any` type used on all fields and parameters — eliminates all TypeScript safety benefits
- The product lookup logic (the `for` loop) is duplicated across two methods, violating DRY
- No handling for product not found — accessing `.id` or `.quantidadeEstoque` on `undefined` throws a runtime error
- String built with `+` concatenation instead of template literals
- `hasEstoqueProduto` uses an explicit `if/else` to return `true`/`false` unnecessarily

**Refactored code:**

```typescript
interface Produto {
  id: number;
  descricao: string;
  quantidadeEstoque: number;
}

class Verdureira {
  private readonly produtos: Produto[];

  constructor() {
    this.produtos = [
      { id: 1, descricao: "Maçã", quantidadeEstoque: 20 },
      { id: 2, descricao: "Laranja", quantidadeEstoque: 0 },
      { id: 3, descricao: "Limão", quantidadeEstoque: 20 },
    ];
  }

  private findProdutoById(produtoId: number): Produto | undefined {
    return this.produtos.find((p) => p.id === produtoId);
  }

  getDescricaoProduto(produtoId: number): string {
    const produto = this.findProdutoById(produtoId);
    if (!produto) return `Product ${produtoId} not found.`;
    return `${produto.id} - ${produto.descricao} (${produto.quantidadeEstoque}x)`;
  }

  hasEstoqueProduto(produtoId: number): boolean {
    const produto = this.findProdutoById(produtoId);
    return (produto?.quantidadeEstoque ?? 0) > 0;
  }
}
```

**Improvements for this exercise:**

- `Produto` converted from a class to an `interface` — it holds no behaviour, only data
- All types are explicit: `number`, `string`, `boolean` — no `any` anywhere
- `private readonly produtos` — prevents accidental reassignment of the array from outside
- `findProdutoById()` is a private helper that centralises the lookup, eliminating duplication
- `find()` replaces the manual `for` loop — shorter, more readable, and stops at the first match
- Strict equality (`===`) instead of loose equality (`==`) avoids subtle coercion bugs
- `hasEstoqueProduto` returns the boolean expression directly via optional chaining and nullish coalescing
- Template literals replace string concatenation

---

### 1.2 Generics and Utility Types

**Supporting types:**

```typescript
interface PaginaParams {
  page: number; // 1-based
  pageSize: number;
}

interface Pagina<T> {
  items: T[];
  total: number;
}
```

**Implementation:**

```typescript
function filtrarEPaginar<T>(data: T[], filterFn: (item: T) => boolean, params: PaginaParams): Pagina<T> {
  const filtered = data.filter(filterFn);
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return { items, total: filtered.length };
}
```

**Usage example:**

```typescript
interface Usuario {
  id: number;
  nome: string;
  email: string;
}

const usuarios: Usuario[] = [
  { id: 1, nome: "Alice", email: "alice@email.com" },
  { id: 2, nome: "Alberto", email: "alberto@email.com" },
  { id: 3, nome: "Bruno", email: "bruno@email.com" },
  { id: 4, nome: "Beatriz", email: "beatriz@email.com" },
  { id: 5, nome: "Carlos", email: "carlos@email.com" },
];

const result = filtrarEPaginar<Usuario>(usuarios, (u) => u.nome.toLowerCase().startsWith("a"), { page: 1, pageSize: 10 });

// How it goes:
//  result.total → 2  (Alice, Alberto)
//  result.items → [{ id: 1, nome: 'Alice', ... }, { id: 2, nome: 'Alberto', ... }]
console.log(result);
```

**Key design decisions:**

- `T` is inferred from the `data` argument — no need to specify it explicitly at the call site in most cases
- `filterFn` receives `T` and returns `boolean`, keeping the function pure and composable
- `PaginaParams` uses a 1-based `page` index to match common UI conventions
- `total` reflects the filtered count (not the original array length), which is what a paginator component needs

---

## 2. Angular — Fundamentals and Reactivity

### 2.1 Change Detection and OnPush

**Problem identified:**

With `ChangeDetectionStrategy.OnPush`, Angular only runs change detection for a component when:

1. An `@Input()` reference changes
2. An event originates from the component or its children
3. An `async pipe` resolves a new value
4. Change detection is triggered manually via `ChangeDetectorRef`

In this component, `texto` is assigned inside a `subscribe` callback. Because the Observable emits asynchronously (after 500 ms via `delay`), the assignment happens outside Angular's zone — or at least outside the OnPush trigger window. Angular does not know the property changed, so the view is never updated.

The `setInterval` keeps the component's zone alive but does not trigger OnPush change detection for this component specifically.

**Fix — inject `ChangeDetectorRef` and call `markForCheck()`:**

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { of, Subscription } from "rxjs";
import { delay } from "rxjs/operators";
import { Injectable } from "@angular/core";

@Injectable()
class PessoaService {
  buscarPorId(id: number) {
    return of({ id, nome: "João" }).pipe(delay(500));
  }
}

@Component({
  selector: "app-root",
  providers: [PessoaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>{{ texto }}</h1>`,
})
export class AppComponent implements OnInit, OnDestroy {
  texto: string = "";
  contador = 0;
  subscriptionBuscarPessoa: Subscription;

  constructor(
    private readonly pessoaService: PessoaService,
    private readonly cdr: ChangeDetectorRef, // ← injected
  ) {}

  ngOnInit(): void {
    this.subscriptionBuscarPessoa = this.pessoaService.buscarPorId(1).subscribe((pessoa) => {
      this.texto = `Nome: ${pessoa.nome}`;
      this.cdr.markForCheck(); // ← marks the view as dirty
    });

    setInterval(() => this.contador++, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptionBuscarPessoa?.unsubscribe();
  }
}
```

**Why `markForCheck()` and not `detectChanges()`:**

- `markForCheck()` marks the component and all its ancestors as dirty, letting Angular include them in the next scheduled change detection cycle — safe and idiomatic for OnPush
- `detectChanges()` triggers synchronous detection immediately on this component's subtree, which can cause issues if called at the wrong time and is generally considered a lower-level escape hatch

**Also fixed `ngOnDestroy`:**

The original `ngOnDestroy` was empty. The subscription is now unsubscribed to prevent memory leaks.

---

### 2.2 RxJS — Eliminating Nested Subscriptions

**Operator chosen: `forkJoin`**

`forkJoin` is the right choice here because both calls — `buscarPorId` and `buscarQuantidadeFamiliares` — are **independent** of each other. They can run in parallel, and we only care about the result when both complete. This is semantically equivalent to `Promise.all`.

Using `switchMap` would be technically correct but would serialise the requests (the second only starts after the first completes), which is unnecessary and slower in this case.

**Refactored code:**

```typescript
import { forkJoin, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Option A — using takeUntilDestroyed (Angular 16+, preferred in standalone components)
ngOnInit(): void {
  const pessoaId = 1;

  forkJoin({
    pessoa: this.pessoaService.buscarPorId(pessoaId),
    qtd: this.pessoaService.buscarQuantidadeFamiliares(pessoaId),
  })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ pessoa, qtd }) => {
      this.texto = `Nome: ${pessoa.nome} | familiares: ${qtd}`;
    });
}
```

```typescript
// Option B — manual unsubscribe (compatible with class-based components)
private subscription: Subscription;

ngOnInit(): void {
  const pessoaId = 1;

  this.subscription = forkJoin({
    pessoa: this.pessoaService.buscarPorId(pessoaId),
    qtd: this.pessoaService.buscarQuantidadeFamiliares(pessoaId),
  }).subscribe(({ pessoa, qtd }) => {
    this.texto = `Nome: ${pessoa.nome} | familiares: ${qtd}`;
  });
}

ngOnDestroy(): void {
  this.subscription?.unsubscribe();
}
```

**Why this avoids memory leaks:**

`forkJoin` completes automatically once all source Observables complete, so in this case the subscription self-terminates. The `takeUntilDestroyed` / `unsubscribe` pattern is still included as a best practice for cases where the component is destroyed before the observables complete (e.g., slow network).

---

### 2.3 RxJS — Search with Debounce

**Service:**

```typescript
// src/app/features/users/data-access/user.service.ts
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface User {
  id: number;
  nome: string;
  email: string;
}

@Injectable({ providedIn: "root" })
export class UserService {
  private readonly apiUrl = "https://api.example.com/users";

  constructor(private readonly http: HttpClient) {}

  search(query: string): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { params: { q: query } });
  }
}
```

**Component:**

```typescript
// src/app/features/users/ui/user-search.component.ts
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { AsyncPipe } from "@angular/common";
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, tap } from "rxjs";
import { User, UserService } from "../data-access/user.service";

@Component({
  selector: "app-user-search",
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  templateUrl: "./user-search.component.html",
})
export class UserSearchComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl("", { nonNullable: true });
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<User[]>([]);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // wait 500 ms after user stops typing
        distinctUntilChanged(), // skip if value not changed
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap(
          (
            query, // cancels previous in-flight request
          ) =>
            this.userService.search(query).pipe(
              catchError((err) => {
                this.error.set("Failed to load results. Please try again.");
                return of([]);
              }),
              finalize(() => this.isLoading.set(false)),
            ),
        ),
        takeUntilDestroyed(this.destroyRef), // unsubscribes on component destroy
      )
      .subscribe((users) => this.results.set(users));
  }
}
```

**Template:**

```html
<!-- user-search.component.html -->
<input [formControl]="searchControl" placeholder="Search by name..." />

@if (isLoading()) {
<p>Loading...</p>
} @if (error()) {
<p class="error">{{ error() }}</p>
} @for (user of results(); track user.id) {
<div class="user-card">
  <strong>{{ user.nome }}</strong>
  <span>{{ user.email }}</span>
</div>
}
```

**Operator responsibilities:**

| Operator                 | Role                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `debounceTime(500)`      | Waits 500 ms of silence before emitting                                               |
| `distinctUntilChanged()` | Skips emission if the value is the same as before                                     |
| `switchMap`              | Cancels the previous HTTP request when a new value arrives (prevents race conditions) |
| `catchError`             | Handles HTTP errors gracefully without killing the stream                             |
| `finalize`               | Ensures `isLoading` is set to `false` regardless of success or failure                |
| `takeUntilDestroyed`     | Automatically unsubscribes when the component is destroyed                            |

---

### 2.4 Performance — OnPush and trackBy

**Why `trackBy` improves performance and how to implement it correctly:**

By default, when Angular re-renders a list with `@for` / `*ngFor`, it compares items by **object reference**. If the array is reassigned (even with the same data), every reference is new — Angular destroys and recreates every DOM node in the list, even if the underlying data hasn't changed.

`trackBy` tells Angular how to uniquely identify each item. When the list changes, Angular compares track values instead of references: only items whose identity changed get re-created in the DOM.

```typescript
// Component
trackByUserId(index: number, user: User): number {
  return user.id;
}
```

```html
<!-- Template (Angular 17+ @for syntax) -->
@for (user of users; track user.id) {
<app-user-card [user]="user" />
}

<!-- Or with legacy *ngFor -->
<app-user-card *ngFor="let user of users; trackBy: trackByUserId" [user]="user" />
```

**How `ChangeDetectionStrategy.OnPush` reduces unnecessary detection cycles:**

With `OnPush`, a child component (e.g. `<app-user-card>`) only re-runs change detection when:

- One of its `@Input()` references changes
- An event originates from within it
- An `async pipe` emits a new value

In a list of hundreds of cards, if only one item changes, only that card's component tree is checked — not all hundreds. Combined with `trackBy`, Angular skips DOM reconciliation for unchanged items **and** skips change detection for unchanged components.

**Impact of using the Default strategy:**

With `ChangeDetectionStrategy.Default`, Angular checks every component in the tree on every event (click, keypress, timer tick, HTTP response, etc.). For a list of 500 items, a single user interaction triggers 500+ change detection cycles. This causes:

- Visible frame drops and janky scrolling
- Wasted CPU cycles checking components whose data hasn't changed
- Worse performance on low-end devices

The combination of `OnPush` + `trackBy` is considered the standard baseline for any list-heavy Angular UI.

---

## 3. State Management

### 3.1 Angular Signals — Local Cart Counter

```typescript
// cart.component.ts
import { Component, computed, output, signal, effect } from "@angular/core";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: "app-cart",
  standalone: true,
  template: `
    <h2>Cart ({{ items().length }} products)</h2>
    <p>Total: {{ total() | currency }}</p>

    @for (item of items(); track item.id) {
      <div>
        <span>{{ item.name }} — {{ item.quantity }}x</span>
        <button (click)="removeItem(item.id)">Remove</button>
      </div>
    }

    <button (click)="addItem({ id: Date.now(), name: 'Product', price: 29.9, quantity: 1 })">Add item</button>
  `,
})
export class CartComponent {
  // Signal — source of truth for the cart items
  readonly items = signal<CartItem[]>([]);

  // Computed — derives total from items, recomputes only when items change
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

  // Output — emits whenever total changes
  readonly totalChanged = output<number>();

  constructor() {
    // effect() runs whenever total() changes and emits the new value
    effect(() => {
      this.totalChanged.emit(this.total());
    });
  }

  addItem(newItem: CartItem): void {
    this.items.update((current) => {
      const existing = current.find((i) => i.id === newItem.id);
      if (existing) {
        // Item already in cart — increment quantity immutably
        return current.map((i) => (i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...current, newItem];
    });
  }

  removeItem(itemId: number): void {
    this.items.update((current) => current.filter((i) => i.id !== itemId));
  }
}
```

**Key design decisions:**

- `signal()` is the single source of truth — all mutations go through `update()` to ensure immutability
- `computed()` is lazy and memoized — it only recalculates when `items` signal changes
- `effect()` reacts to `total` changes and bridges Signals to the `output()` event emitter
- `output()` is the modern Angular 17+ API replacing `@Output() + EventEmitter`

---

### 3.2 NgRx — To-do Feature

**Actions:**

```typescript
// store/todo.actions.ts
import { createAction, createActionGroup, emptyProps, props } from "@ngrx/store";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export const TodoActions = createActionGroup({
  source: "Todo",
  events: {
    "Load Todos": emptyProps(),
    "Load Todos Success": props<{ todos: Todo[] }>(),
    "Load Todos Error": props<{ error: string }>(),
    "Toggle Todo Complete": props<{ id: number }>(),
  },
});
```

> `createActionGroup` is the modern NgRx pattern — it groups related actions, avoids repetition, and provides strongly-typed action creators automatically.

---

**State interface and Reducer:**

```typescript
// store/todo.reducer.ts
import { createReducer, on } from "@ngrx/store";
import { TodoActions, Todo } from "./todo.actions";

export interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

export const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

export const todoReducer = createReducer(
  initialState,

  on(TodoActions.loadTodos, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TodoActions.loadTodosSuccess, (state, { todos }) => ({
    ...state,
    todos,
    loading: false,
  })),

  on(TodoActions.loadTodosError, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(TodoActions.toggleTodoComplete, (state, { id }) => ({
    ...state,
    todos: state.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
  })),
);
```

---

**Selectors:**

```typescript
// store/todo.selectors.ts
import { createFeatureSelector, createSelector } from "@ngrx/store";
import { TodoState } from "./todo.reducer";

export const selectTodoState = createFeatureSelector<TodoState>("todo");

export const selectAllTodos = createSelector(selectTodoState, (state) => state.todos);

export const selectPendingTodos = createSelector(selectAllTodos, (todos) => todos.filter((todo) => !todo.completed));

export const selectTodosLoading = createSelector(selectTodoState, (state) => state.loading);

export const selectTodosError = createSelector(selectTodoState, (state) => state.error);
```

> Selectors are memoized — `selectPendingTodos` only recomputes when `selectAllTodos` emits a new reference, preventing unnecessary recalculations.

---

**Effect (functional style — Angular 17+ / NgRx 17+):**

```typescript
// store/todo.effects.ts
import { inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { HttpClient } from "@angular/common/http";
import { catchError, map, of, switchMap } from "rxjs";
import { TodoActions, Todo } from "./todo.actions";

export const loadTodosEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(TodoActions.loadTodos),
      switchMap(() =>
        http.get<Todo[]>("https://api.example.com/todos").pipe(
          map((todos) => TodoActions.loadTodosSuccess({ todos })),
          catchError((error) => of(TodoActions.loadTodosError({ error: error.message }))),
        ),
      ),
    ),
  { functional: true },
);
```

**Why `switchMap` here:**

- `loadTodos` can be dispatched multiple times (e.g. page refresh)
- `switchMap` cancels the previous in-flight HTTP request before starting a new one, preventing stale responses from overwriting fresh data
- `catchError` is placed inside `switchMap` (not outside) so the effect stream stays alive after an error — otherwise a single failed request would permanently kill the effect

---

**Registration (app.config.ts):**

```typescript
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { todoReducer } from './store/todo.reducer';
import { loadTodosEffect } from './store/todo.effects';

export const appConfig = {
  providers: [
    provideStore({ todo: todoReducer }),
    provideEffects({ loadTodosEffect }),
  ],
};
`
```
