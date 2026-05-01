import { Component } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button>
      <ng-content></ng-content>
    </button>
  `,
})
export class UiButtonComponent {}
