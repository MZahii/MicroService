import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffRolesDetails } from './staff-roles-details';

describe('StaffRolesDetails', () => {
  let component: StaffRolesDetails;
  let fixture: ComponentFixture<StaffRolesDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffRolesDetails]
    }).compileComponents();

    fixture = TestBed.createComponent(StaffRolesDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
