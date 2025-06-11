
export const BettingForm = () => {
    return(
<div className="ml-4 p-6 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Place Your Bet</h2>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="betAmount" className="block text-sm font-medium text-gray-300">
                                Bet Amount (USD)
                            </label>
                            <input
                                type="number"
                                id="betAmount"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                            >
                                Long
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                            >
                                Short
                            </button>
                        </div>
                    </form>
                </div>
    )
}