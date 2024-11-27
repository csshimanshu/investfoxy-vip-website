// Base testimonial interface for common required fields
export interface BaseTestimonial {
  id: string;
  name: string;
  initials: string;
  joinDate: string;
  roi: number;
  quote: string;
}

// Interface for testimonials in content.json
export interface Testimonial extends BaseTestimonial {
  profilePhoto?: string; // Optional field
}

// Interface for testimonial input data
export interface TestimonialInput {
  name: string;
  initials: string;
  joinDate: string;
  roi: number | string;
  quote: string;
  profilePhoto?: string;
  profilePhotoData?: string;
}

// Interface for the content.json file structure
export interface ContentJson {
  testimonials: Testimonial[];
  [key: string]: any;
}
