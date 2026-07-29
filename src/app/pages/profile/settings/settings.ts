import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStoreService } from '../../../services/auth-store/auth-store.service';

@Component({
  selector: 'app-profile-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
})
export class ProfileSettings implements OnInit {
  private router = inject(Router);
  authStore = inject(AuthStoreService);

  isLoggedIn = computed(() => this.authStore.isLoggedIn());
  customerName = computed(() => this.authStore.customerName());
  customerPhone = computed(() => this.authStore.customerPhone());
  customerEmail = computed(() => this.authStore.customerEmail());

  editName = signal('');
  editPhone = signal('');
  editEmail = signal('');
  editMode = signal(false);
  isSaving = signal(false);
  saveError = signal('');
  saveSuccess = signal('');

  ngOnInit() {
    this.editName.set(this.customerName());
    this.editPhone.set(this.customerPhone());
    this.editEmail.set(this.customerEmail());
  }

  startEdit() {
    this.editName.set(this.customerName());
    this.editPhone.set(this.customerPhone());
    this.editEmail.set(this.customerEmail());
    this.editMode.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');
  }

  cancelEdit() { this.editMode.set(false); this.saveError.set(''); }

  saveProfile() {
    const name = this.editName().trim();
    if (!name) { this.saveError.set('يرجى إدخال الاسم'); return; }
    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');
    this.authStore.updateProfile({ name, phone: this.editPhone().trim() || undefined, email: this.editEmail().trim() || undefined }).subscribe({
      next: () => {
        this.authStore.updateLocalProfile({ name, phone: this.editPhone().trim() || undefined, email: this.editEmail().trim() || undefined });
        this.isSaving.set(false);
        this.editMode.set(false);
        this.saveSuccess.set('تم تحديث البيانات بنجاح');
        setTimeout(() => this.saveSuccess.set(''), 3000);
      },
      error: (err: any) => { this.isSaving.set(false); this.saveError.set(err?.error?.message ?? 'فشل تحديث البيانات'); },
    });
  }

  back() { this.router.navigate(['/profile']); }
}
