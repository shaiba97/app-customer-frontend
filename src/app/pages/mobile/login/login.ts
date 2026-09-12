import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { LucideUser, LucideLock, LucideEye, LucideEyeOff, LucideAlertCircle } from '@lucide/angular';
import { AuthStoreService } from '../../../services/auth-store/auth-store.service';
import { JsonLdService } from '../../../services/json-ld/json-ld.service';
import { currentPath, pageGraph } from '../../../services/json-ld/json-ld';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, NgOptimizedImage, LucideUser, LucideLock, LucideEye, LucideEyeOff, LucideAlertCircle],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStoreService);
  private jsonLd = inject(JsonLdService);

  identifier = signal<string>('');
  password = signal<string>('');
  error = signal<string>('');
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  ngOnInit(): void {
    this.jsonLd.set('page', pageGraph('تسجيل الدخول', currentPath(this.router.url), [{ name: 'تسجيل الدخول' }]));
  }

  submit(): void {
    const id = this.identifier().trim();
    const pw = this.password().trim();
    if (!id) {
      this.error.set('يرجى إدخال البريد أو الهاتف');
      return;
    }
    if (!pw) {
      this.error.set('يرجى إدخال كلمة المرور');
      return;
    }
    this.error.set('');
    this.isLoading.set(true);
    this.authStore.login({ email: id, phone: id, password: pw }).subscribe({
      next: (res: any) => {
        const token = res?.token;
        const user = res?.user;
        if (!token || !user) {
          this.error.set('فشل تسجيل الدخول');
          this.isLoading.set(false);
          return;
        }
        this.authStore.setSession(token, user);
        this.isLoading.set(false);
        this.router.navigate(['/m/home']);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'بيانات الدخول غير صحيحة');
        this.isLoading.set(false);
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/m/register']);
  }
}