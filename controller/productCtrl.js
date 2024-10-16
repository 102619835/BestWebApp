const Product = require('../models/productModel'); // Make sure the path is correct
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

// Controller to create a product
const createProduct = asyncHandler(async (req, res) => {
    try {
        // Check if title is provided, if so, generate slug
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }

        // Create the new product
        const newProduct = await Product.create(req.body);

        // Send success response with status 201 (created)
        res.status(201).json({
            success: true,
            product: newProduct,
        });
    } catch (error) {
        // Specific error handling
        if (error.name === 'ValidationError') {
            // Handle validation errors from Mongoose (missing required fields, etc.)
            res.status(400).json({
                success: false,
                message: 'Validation error: ' + error.message,
                errors: error.errors, // Optionally return detailed field errors
            });
        } else if (error.code === 11000) {
            // Handle MongoDB duplicate key error (e.g., unique fields like slug or title)
            res.status(400).json({
                success: false,
                message: 'Duplicate field error: A product with the same slug or unique field already exists',
                field: error.keyValue, // Return which field is duplicated (e.g., slug)
            });
        } 
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; // Assuming product ID is passed as a URL parameter

        // Check if product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // If title is being updated, regenerate the slug
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }

        // Update product fields with the new data
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on the updated fields
        });

        // Return the updated product
        res.status(200).json({
            success: true,
            product: updatedProduct,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the product: ' + error.message,
        });
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; // Assuming product ID is passed as a URL parameter

        // Find the product by ID
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        // Handle server error
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the product: ' + error.message,
        });
    }
});


const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;  // Assuming the product ID is passed as a URL parameter

    // Find the product by ID
    const findProduct = await Product.findById(id);

    if (!findProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.json(findProduct); // Send back the product details
});

const getAllProducts = asyncHandler(async (req, res) => {
    try {
        // Destructure query parameters
        const { category, brand, priceMin, priceMax, sort, page, limit } = req.query;

        // Build a filter object
        let filter = {};

        // Add category filter if provided
        if (category) {
            filter.category = category;
        }

        // Add brand filter if provided
        if (brand) {
            filter.brand = brand;
        }

        // Add price range filter if provided
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) filter.price.$gte = priceMin;
            if (priceMax) filter.price.$lte = priceMax;
        }

        // Handle sorting (sort by a field, e.g., price, createdAt)
        let sortOption = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
            const sortOrder = sort.startsWith('-') ? -1 : 1; // If the sort param starts with '-', sort in descending order
            sortOption[sortField] = sortOrder;
        }

        // Handle pagination
        const itemsPerPage = parseInt(limit) || 10; // Default to 10 items per page
        const pageNum = parseInt(page) || 1; // Default to page 1
        const skip = (pageNum - 1) * itemsPerPage;

        // Fetch products with filters, sorting, and pagination
        const allProducts = await Product.find(filter)
            .populate('category')
            .populate('rating.postedby')
            .sort(sortOption)
            .skip(skip)
            .limit(itemsPerPage);

        // Get total count of products for pagination
        const totalProducts = await Product.countDocuments(filter);

        // Send back all the products and pagination info
        res.json({
            success: true,
            total: totalProducts,
            currentPage: pageNum,
            totalPages: Math.ceil(totalProducts / itemsPerPage),
            products: allProducts,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


module.exports = { 
    createProduct,
    getProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
};
