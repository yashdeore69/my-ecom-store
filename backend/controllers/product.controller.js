import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}); //find/get all products
        res.json({products});
    } catch (error) {
        console.log("Error in getAllProducts controller", error.message)
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts) {
            return res.json( JSON.parse(featuredProducts) );
        }
        
        //if not in redis, then fetch from mongodb
        //.lean() is used to get a plain javascript object instead of a mongoose object
        //this is useful for performance and to avoid unnecessary overhead
        featuredProducts = await Product.find({isFeatured: true}).lean();
  
        if (!featuredProducts) {
            return res.status(404).json({message: "No featured products found"});
        }

        //store in redis for future quick requests
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.json(featuredProducts);
    } catch (error) {
        console.log("Error in getFeaturedProducts controller", error.message);
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const {name, description, price, category} = req.body;

        let cloudinaryResponse = null;

        if(image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"});
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: cloudinaryResponse?.secure_url? cloudinaryResponse.secure_url : " ",
        });
        res.status(201).json(product);
    } catch (error) {
        
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];// get the public id from the image url
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
            } catch (error) {
                console.log("error deleting image from cloduinary", error);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}