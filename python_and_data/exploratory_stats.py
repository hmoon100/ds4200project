import pandas as pd
import altair as alt
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

# Configuration
FEATURES = [
    'acousticness', 'danceability', 'energy', 'valence',
    'instrumentalness', 'liveness', 'speechiness'
]

PLOT_CONFIG = {
    'correlation': {'figsize': (6, 5)},
    'seasonal': {'figsize': (10, 7)},
    'monthly': {'figsize': (10, 7)}
}


class SpotifyAnalysis:
    def __init__(self, data_path, output_dir):
        """Initialize the analysis with data path and output directory."""
        self.data_path = Path(data_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.df = None

    def load_data(self):
        """Load and prepare the dataset."""
        self.df = pd.read_csv(self.data_path)
        return self

    def create_correlation_heatmap(self):
        """Generate correlation heatmap with smaller text and image size."""
        # Set smaller image size for heatmap
        plt.figure(figsize=PLOT_CONFIG['correlation']['figsize'])

        # Calculate the correlation matrix
        correlation_matrix = self.df[FEATURES].corr()

        # Create the heatmap with annotations
        sns.heatmap(correlation_matrix, annot=True, cmap='Blues',
                    center=0, fmt='.2f', annot_kws={'size': 8})  # Smaller text for annotations

        # Customize title and axis labels with smaller fonts
        plt.title('Correlation Between Audio Features', fontsize=10)
        plt.xlabel('Features', fontsize=8)
        plt.ylabel('Features', fontsize=8)

        # Adjust layout for tight fit and save image
        plt.tight_layout()
        plt.savefig(self.output_dir / 'correlation_heatmap.png', dpi=300)
        plt.close()

    def create_seasonal_distribution(self):
        """Generate seasonal distribution plot with annotations."""
        # Create a seasonal distribution bar plot
        plt.figure(figsize=PLOT_CONFIG['seasonal']['figsize'])

        # Create subplot layout for the seasonal plot
        gs = plt.GridSpec(2, 1, height_ratios=[2, 1])
        ax1 = plt.subplot(gs[0])

        # Group by 'season' and calculate means for each feature
        seasonal_means = self.df.groupby('season')[FEATURES].mean()
        seasonal_means.plot(kind='bar', ax=ax1)

        # Customize plot labels and title
        plt.title('Audio Features Distribution Across Seasons (2018)')
        plt.xlabel('Season')
        plt.ylabel('Average Value')

        # Add annotations for key insights
        max_energy_season = seasonal_means['energy'].idxmax()
        max_dance_season = seasonal_means['danceability'].idxmax()
        plt.annotate(f'Peak Energy: {max_energy_season}',
                     xy=(seasonal_means.index.get_loc(max_energy_season),
                         seasonal_means.loc[max_energy_season, 'energy']),
                     xytext=(10, 10), textcoords='offset points')

        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'seasonal_distribution.png')
        plt.close()

    def create_monthly_trends(self):
        """Generate monthly trends plot using Altair and export as PNG."""
        print("Creating monthly trends plot...")

        # Calculate the monthly means for each feature
        monthly_means = self.df.groupby('month')[FEATURES].mean().reset_index()

        # Melt the DataFrame for Altair compatibility
        monthly_means_melted = pd.melt(monthly_means, id_vars=['month'], value_vars=FEATURES,
                                       var_name='Feature', value_name='Average Value')

        # Create the Altair line chart
        chart = alt.Chart(monthly_means_melted).mark_line().encode(
            x=alt.X('month:O', title='Month'),
            y=alt.Y('Average Value:Q', title='Average Value'),
            color=alt.Color('Feature:N', legend=alt.Legend(title='Audio Features')),
            tooltip=['month', 'Feature', 'Average Value']
        ).properties(
            title='Monthly Trends in Audio Features',
            width=800,
            height=500
        )

        output_path = self.output_dir / 'monthly_trends.png'
        chart.save(str(output_path))

    def run_analysis(self):
        """Run the full analysis pipeline."""
        print("Starting analysis...")
        self.load_data()
        self.create_correlation_heatmap()
        self.create_seasonal_distribution()
        self.create_monthly_trends()
        print("Analysis complete! Files saved to:", self.output_dir)


if __name__ == "__main__":
    analyzer = SpotifyAnalysis(
        data_path='spotify_charts_with_features_2018_complete.csv',
        output_dir='static'
    )
    analyzer.run_analysis()
