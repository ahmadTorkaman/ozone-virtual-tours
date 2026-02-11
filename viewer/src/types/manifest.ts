export interface Manifest {
  version: number;
  project: { name: string; slug: string };
  scenes: SceneEntry[];
  panoramas: PanoramaEntry[];
  configurable_components: ConfigurableComponent[];
  branding: { firm_name: string; firm_logo: string | null };
}

export interface SceneEntry {
  id: string;
  name: string;
  file: string;
  thumbnail: string;
}

export interface PanoramaEntry {
  id: string;
  name: string;
  file: string;
  thumbnail: string;
}

export interface ConfigurableComponent {
  id: string;
  scene_id: string;
  name: string;
  mesh_names: string[];
  default_material_id: string | null;
  materials: MaterialOption[];
}

export interface MaterialOption {
  id: string;
  name: string;
  thumbnail: string;
  maps: Record<string, string>;
}
