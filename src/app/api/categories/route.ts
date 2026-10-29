import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET() {
  try {
    const categories = orderStore.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    console.error('Error in GET /api/categories:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'CREATE_CATEGORY': {
        const { name, description } = body;
        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: 'Category name is required' },
            { status: 400 }
          );
        }
        const category = orderStore.createCategory({ name, description });
        return NextResponse.json({
          success: true,
          message: `Category "${category.name}" created successfully`,
          category,
          categories: orderStore.getCategories(),
        });
      }

      case 'DELETE_CATEGORY': {
        const { categoryId } = body;
        if (!categoryId) {
          return NextResponse.json(
            { success: false, error: 'Category ID is required' },
            { status: 400 }
          );
        }
        const success = orderStore.deleteCategory(categoryId);
        return NextResponse.json({
          success,
          message: success ? 'Category deleted successfully' : 'Category not found',
          categories: orderStore.getCategories(),
        });
      }

      case 'CREATE_SUB_CATEGORY': {
        const { categoryId, name, description } = body;
        if (!categoryId || !name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: 'Category ID and Sub-Category name are required' },
            { status: 400 }
          );
        }
        const subCategory = orderStore.createSubCategory(categoryId, { name, description });
        if (!subCategory) {
          return NextResponse.json(
            { success: false, error: 'Parent category not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: `Sub-Category "${subCategory.name}" created successfully`,
          subCategory,
          categories: orderStore.getCategories(),
        });
      }

      case 'DELETE_SUB_CATEGORY': {
        const { categoryId, subCategoryId } = body;
        if (!categoryId || !subCategoryId) {
          return NextResponse.json(
            { success: false, error: 'Category ID and Sub-Category ID are required' },
            { status: 400 }
          );
        }
        const success = orderStore.deleteSubCategory(categoryId, subCategoryId);
        return NextResponse.json({
          success,
          message: success ? 'Sub-Category deleted successfully' : 'Sub-Category not found',
          categories: orderStore.getCategories(),
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error in POST /api/categories:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
