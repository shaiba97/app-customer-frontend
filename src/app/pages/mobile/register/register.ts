import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { LucideUser, LucideLock, LucidePhone, LucideAlertCircle } from '@lucide/angular';
import { AuthStoreService } from '../../../services/auth-store/auth-store.service';
import { switchMap } from 'rxjs/operators';
import { JsonLdService } from '../../../services/json-ld/json-ld.service';
import { currentPath, pageGraph } from '../../../services/json-ld/json-ld';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, NgOptimizedImage, LucideUser, LucideLock, LucidePhone, LucideAlertCircle],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStoreService);
  private jsonLd = inject(JsonLdService);

  name = signal<string>('');
  phone = signal<string>('');
  password = signal<string>('');
  agreedToTerms = signal<boolean>(false);
  error = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.jsonLd.set('page', pageGraph('إنشاء حساب جديد', currentPath(this.router.url), [{ name: 'إنشاء حساب جديد' }]));
  }

  submit(): void {
    const n = this.name().trim();
    const phoneRaw = this.phone().trim();
    const pw = this.password().trim();
    if (!n) {
      this.error.set('يرجى إدخال الاسم');
      return;
    }
    if (!/^\d{9}$/.test(phoneRaw)) {
      this.error.set('يرجى إدخال رقم هاتف مكوّن من 9 أرقام');
      return;
    }
    if (!pw || pw.length < 6) {
      this.error.set('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (!this.agreedToTerms()) {
      this.error.set('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية');
      return;
    }
    this.error.set('');
    this.isLoading.set(true);
    const phoneWithCountry = `+249${phoneRaw}`;
    this.authStore.register({ name: n, phone: phoneWithCountry, email: undefined, password: pw }).pipe(
      switchMap((reg) => {
        // Registration failures (e.g. duplicate account) arrive as a normal
        // response — only chain into auto-login on actual success.
        if (!reg?.success || !reg?.data) {
          throw new Error(reg?.message || 'فشل إنشاء الحساب');
        }
        return this.authStore.login({ email: phoneWithCountry, phone: phoneWithCountry, password: pw });
      }),
    ).subscribe({
      next: (res: any) => {
        const token = res?.token;
        const user = res?.user;
        if (token && user) {
          this.authStore.setSession(token, user);
        }
        this.isLoading.set(false);
        this.router.navigate(['/m/home']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || err?.message;
        if (msg) {
          this.error.set(msg);
        } else {
          this.router.navigate(['/m/login']);
        }
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/m/login']);
  }
}