import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SplashScreen } from './shared/splash-screen/splash-screen';
import { OfflineScreen } from './shared/offline-screen/offline-screen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreen, OfflineScreen],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly splashDone = signal(isPlatformServer(inject(PLATFORM_ID)));

  onSplashDone(): void {
    this.splashDone.set(true);
  }
}
