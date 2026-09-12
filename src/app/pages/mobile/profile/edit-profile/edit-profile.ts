import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStoreService } from '../../../../services/auth-store/auth-store.service';
import { JsonLdService } from '../../../../services/json-ld/json-ld.service';
import { currentPath, pageGraph } from '../../../../services/json-ld/json-ld';
import { LucideUser, LucidePhone, LucideMail, LucideLock, LucideEye, LucideEyeOff, LucideAlertCircle, LucideCheckCircle2 } from '@lucide/angular';

@Component({
  selector: 'app-edit-profile',
  imports: [FormsModule, LucideUser, LucidePhone, LucideMail, LucideLock, LucideEye, LucideEyeOff, LucideAlertCircle, LucideCheckCircle2],
  templateUrl: './edit-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfile implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStoreService);
  private jsonLd = inject(JsonLdService);

  name = signal('');
  phone = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);

  nameError = signal('');
  passwordError = signal('');
  error = signal('');
  success = signal('');
  isSaving = signal(false);

  ngOnInit(): void {
    this.jsonLd.set('page', pageGraph('تعديل الحساب', currentPath(this.router.url), [
      { name: 'حسابي', url: `${currentPath(this.router.url).replace(/\/edit$/, '')}` },
      { name: 'تعديل الحساب' },
    ]));
    this.name.set(this.authStore.customerName());
    this.phone.set(this.authStore.customerPhone());
    this.email.set(this.authStore.customerEmail());
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  goBack(): void {
    this.router.navigate([this.router.url.startsWith('/m/') ? '/m/profile' : '/profile']);
  }

  save(): void {
    const trimmedName = this.name().trim();
    const trimmedPhone = this.phone().trim();
    const trimmedEmail = this.email().trim();
    const pass = this.password();

    this.nameError.set(trimmedName.length < 2 ? 'يرجى إدخال الاسم' : '');
    this.passwordError.set(pass.length > 0 && pass.length < 6 ? '٦ أحرف على الأقل' : '');
    if (this.nameError() || this.passwordError()) return;

    this.isSaving.set(true);
    this.error.set('');
    this.success.set('');

    const payload = {
      name: trimmedName,
      phone: trimmedPhone || undefined,
      email: trimmedEmail || undefined,
    };

    this.authStore.updateProfile(payload).subscribe({
      next: () => {
        this.authStore.updateLocalProfile(payload);
        if (!pass) {
          this.done();
          return;
        }
        this.authStore.updatePassword(pass).subscribe({
          next: () => this.done(),
          error: (err: any) => {
            this.isSaving.set(false);
            this.error.set(err?.error?.message ?? 'فشل تحديث كلمة المرور');
          },
        });
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message ?? 'فشل تحديث البيانات');
      },
    });
  }

  private done(): void {
    this.isSaving.set(false);
    this.success.set('تم التحديث بنجاح');
    this.router.navigate([this.router.url.startsWith('/m/') ? '/m/profile' : '/profile']);
  }
}