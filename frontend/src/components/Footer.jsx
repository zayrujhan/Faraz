function Footer() {
    return (
        <footer className="border-t border-gray-300 mt-12">

            <div className="max-w-6xl mx-auto px-6 py-10
                            grid grid-cols-2 md:grid-cols-5 gap-8">

                {/* Logo / Company information */}
                <div className="col-span-2 md:col-span-1">
                    <div className="w-28 h-12 bg-gray-100 rounded-md
                                    flex items-center justify-center mb-4">
                        <span className="text-gray-400 text-sm">
                            Logo
                        </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-8">
                        Address details
                    </p>

                    <p className="text-sm text-gray-600">
                        © Your Company Name
                    </p>
                </div>


                {/* Main Menu */}
                <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-4">
                        MAIN MENU
                    </h3>

                    <div className="space-y-3 text-sm text-gray-500">
                        <a href="#/" className="block hover:text-gray-800">Home</a>
                        <a href="#" className="block hover:text-gray-800">About</a>
                        <a href="#/shop" className="block hover:text-gray-800">Shop</a>
                        <a href="#" className="block hover:text-gray-800">Help</a>
                    </div>
                </div>


                {/* Company */}
                <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-4">
                        COMPANY
                    </h3>

                    <div className="space-y-3 text-sm text-gray-500">
                        <a href="#" className="block hover:text-gray-800">The Company</a>
                        <a href="#" className="block hover:text-gray-800">Careers</a>
                        <a href="#" className="block hover:text-gray-800">Press</a>
                    </div>
                </div>


                {/* Discover */}
                <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-4">
                        DISCOVER
                    </h3>

                    <div className="space-y-3 text-sm text-gray-500">
                        <a href="#" className="block hover:text-gray-800">The Team</a>
                        <a href="#" className="block hover:text-gray-800">Our History</a>
                        <a href="#" className="block hover:text-gray-800">Brand Motto</a>
                    </div>
                </div>


                {/* Social */}
                <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-4">
                        FIND US ON
                    </h3>

                    <div className="space-y-3 text-sm text-gray-500">
                        <a href="#" className="block hover:text-gray-800">Facebook</a>
                        <a href="#" className="block hover:text-gray-800">X / Twitter</a>
                        <a href="#" className="block hover:text-gray-800">Instagram</a>
                    </div>
                </div>

            </div>

        </footer>
    )
}

export default Footer
