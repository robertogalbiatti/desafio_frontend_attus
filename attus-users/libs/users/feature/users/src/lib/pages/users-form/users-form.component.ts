import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { isValidCPF } from '@attus-users/data-access-users';

export class UsersFormComponent {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpf: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
        ],
      ],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)],
      ],
    });
  }

  submit() {
    if (this.form.invalid) return;

    if (!isValidCPF(this.form.value.cpf!)) {
      alert('CPF inválido');
      return;
    }

    console.log(this.form.value);
  }
}
