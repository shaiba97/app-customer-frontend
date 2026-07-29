import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AwardsService, AwardPack, Earnings, WithdrawalRequest } from '../../../core/services/awards/awards.service';

@Component({
  selector: 'app-awards-page',
  imports: [FormsModule],
  templateUrl: './awards-page.html',
})
export class AwardsPage implements OnInit {
  private router = inject(Router);
  private awardsSvc = inject(AwardsService);

  earnings = signal<Earnings | null>(null);
  packs = signal<AwardPack[]>([]);
  loading = signal(true);
  showWithdrawForm = signal(false);
  submitting = signal(false);
  submitError = signal('');
  submitSuccess = signal('');
  withdrawals = signal<WithdrawalRequest[]>([]);

  bankName = signal('');
  accountHolder = signal('');
  accountNumber = signal('');

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);
    this.awardsSvc.getEarnings().subscribe(e => { this.earnings.set(e); });
    this.awardsSvc.getPacks().subscribe(p => { this.packs.set(p); this.loading.set(false); });
    this.awardsSvc.getWithdrawals().subscribe(w => { this.withdrawals.set(w); });
  }

  requestAward(packId: string) {
    this.awardsSvc.requestAward(packId).subscribe({
      next: () => { this.loadAll(); },
      error: (err: any) => { alert(err?.error?.message ?? 'فشل تقديم الطلب'); },
    });
  }

  openWithdraw() { this.showWithdrawForm.set(true); this.submitError.set(''); this.submitSuccess.set(''); }
  closeWithdraw() { this.showWithdrawForm.set(false); }

  submitWithdraw() {
    const bn = this.bankName().trim();
    const ah = this.accountHolder().trim();
    const an = this.accountNumber().trim();
    if (!bn || !ah || !an) { this.submitError.set('جميع الحقول مطلوبة'); return; }
    this.submitting.set(true);
    this.submitError.set('');
    this.awardsSvc.createWithdrawRequest({ bankName: bn, accountHolder: ah, accountNumber: an }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set('تم تقديم طلب السحب بنجاح');
        this.showWithdrawForm.set(false);
        this.loadAll();
      },
      error: (err: any) => { this.submitting.set(false); this.submitError.set(err?.error?.message ?? 'فشل تقديم الطلب'); },
    });
  }

  back() { this.router.navigate(['/profile']); }

  toArabic(n: number | string): string { return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]); }
  formatAmount(n: number | string): string { return this.toArabic(Math.round(Number(n)).toLocaleString('en')); }
}
