import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplashScreen } from './shared/splash-screen/splash-screen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreen],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly splashDone = signal(false);
}
