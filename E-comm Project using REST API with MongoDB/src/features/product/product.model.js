
export default class ProductModel {
  constructor(
    name,
    desc,
    price,
    imageUrl,
    category,
    sizes,
    id
  ) {
    this._id = id;
    this.name = name;
    this.desc = desc;
    this.imageUrl = imageUrl;
    this.category = category;
    this.price = price;
    this.sizes = sizes;
  }

  
}

