import { Component } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <div style="border:1px solid #ccc; padding:10px; margin:5px;">
      <ng-content></ng-content>
    </div>
  `,
})
export class UiCardComponent {}
