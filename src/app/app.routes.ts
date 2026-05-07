import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
    import('./layout/navbar/navbar.component')
    .then(m => m.NavbarComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
        import('./pages/home/main/main')
        .then(m => m.Main),
      },
      {
        path: 'search-results',
        loadComponent: () =>
        import('./pages/search-results/search-results')
        .then(m => m.SearchResultsComponent),
      }
    ]
  }
];