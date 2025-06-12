import { Routes } from '@angular/router';
import { PublicGistsComponent } from './pages/public-gists/public-gists.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { CreateGistComponent } from './pages/create-gist/create-gist.component';
import { StarredGistsComponent } from './pages/starred-gists/starred-gists.component';
import { GistDetailComponent } from './pages/gist-detail/gist-detail.component';

export const routes: Routes = [
  { path: '', component: PublicGistsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'createGist', component: CreateGistComponent },
  { path: 'starredGists', component: StarredGistsComponent },
  { path: 'createGist', component: CreateGistComponent },
  { path: 'gist/:id', component: GistDetailComponent },
];
