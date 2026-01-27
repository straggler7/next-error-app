import { render, screen } from '@testing-library/react';
import LoadingSpinner, { LoadingOverlay, TableLoadingState } from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default medium size', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('w-8');
    expect(spinner.className).toContain('h-8');
    expect(spinner.className).toContain('animate-spin');
  });

  it('should render with small size when specified', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('w-4');
    expect(spinner.className).toContain('h-4');
  });

  it('should render with large size when specified', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('w-12');
    expect(spinner.className).toContain('h-12');
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('custom-class');
  });

  it('should have proper styling classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('animate-spin');
    expect(spinner.className).toContain('rounded-full');
    expect(spinner.className).toContain('border-2');
  });
});

describe('LoadingOverlay', () => {
  it('should render with default loading message', () => {
    render(<LoadingOverlay />);
    
    const message = screen.getByText('Loading...');
    expect(message).toBeTruthy();
  });

  it('should render with custom message', () => {
    const customMessage = 'Processing your request...';
    render(<LoadingOverlay message={customMessage} />);
    
    const message = screen.getByText(customMessage);
    expect(message).toBeTruthy();
  });

  it('should have overlay styling', () => {
    const { container } = render(<LoadingOverlay />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
    expect(overlay.className).toContain('z-50');
  });
});

describe('TableLoadingState', () => {
  it('should render loading records message', () => {
    render(<TableLoadingState />);
    
    const message = screen.getByText('Loading records...');
    expect(message).toBeTruthy();
  });

  it('should have proper container styling', () => {
    const { container } = render(<TableLoadingState />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');
  });

  it('should have proper text styling', () => {
    render(<TableLoadingState />);
    
    const text = screen.getByText('Loading records...');
    expect(text.className).toContain('text-gray-600');
    expect(text.className).toContain('font-medium');
  });
});

describe('LoadingSpinner edge cases', () => {
  it('should handle empty className gracefully', () => {
    const { container } = render(<LoadingSpinner className="" />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toBeTruthy();
  });

  it('should handle undefined size gracefully', () => {
    const { container } = render(<LoadingSpinner size={undefined as any} />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('w-8'); // Should default to medium
    expect(spinner.className).toContain('h-8');
  });

  it('should render component structure correctly', () => {
    const { container } = render(<LoadingSpinner />);
    
    expect(container.firstChild).toBeTruthy();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});
