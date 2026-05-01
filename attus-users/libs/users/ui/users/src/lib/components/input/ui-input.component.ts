import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label>{{ label }}</label>
    <input [formControl]="control" />
  `,
})
export class UiInputComponent {
  @Input() label!: string;
  @Input() control!: FormControl;
}
