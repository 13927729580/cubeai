import {Routes} from '@angular/router';
import {PersonalComponent} from './personal.component';

export const personalRoutes: Routes = [
    {
        path: 'personal/:authorLogin',
        component: PersonalComponent,
        data: {
            pageTitle: 'CubeAI ★ 智立方',
        },
    },
];
