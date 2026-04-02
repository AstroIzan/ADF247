import { NgModule } from '@angular/core';
import { NotificationsAdminComponent } from './notifications-admin.component';
import { DevicesComponent } from './devices.component';

@NgModule({
  declarations: [],
  imports: [NotificationsAdminComponent, DevicesComponent],
  exports: [NotificationsAdminComponent, DevicesComponent]
})
export class NotificationsModule { }