import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 text-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center"
            >
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-6">
                    <Construction size={48} />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Under Progress</h1>
                
                <p className="text-gray-500 mb-8 max-w-sm">
                    We are currently building this dashboard to bring you the best experience. Stay tuned!
                </p>

                {/* <div className="w-full h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 1.5, 
                            ease: "easeInOut" 
                        }}
                        className="h-full bg-indigo-600 rounded-full w-1/3"
                    />
                </div> */}
            </motion.div>
        </div>
    );
};

export default Dashboard;