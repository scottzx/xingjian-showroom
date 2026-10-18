export interface CarModel {
  id: string; name: string; folderName: string; exportFileName: string;
  width?: number; height?: number;
}
// Original demonstration only; not a manufacturer-specific UV template.
export const carModels: CarModel[] = [{
  id: 'generic-vehicle', name: '通用车身示意 / Generic vehicle',
  folderName: 'generic-vehicle', exportFileName: 'generic_vehicle_design.png',
  width: 1024, height: 1024,
}];
export const defaultModel = carModels[0];
