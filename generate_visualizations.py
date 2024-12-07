import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import altair as alt
import matplotlib.pyplot as plt
import seaborn as sns


class SpotifyVisualizations:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.features = [
            'acousticness', 'danceability', 'energy',
            'instrumentalness', 'liveness', 'speechiness', 'valence'
        ]

    def load_data(self):
        print("Loading data...")
        self.df = pd.read_csv(self.data_path)
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.df['day_of_year'] = self.df['date'].dt.dayofyear
        return self

    def create_monthly_trends(self):
        print("Creating monthly trends plot...")
        plt.figure(figsize=(12, 8))

        monthly_means = self.df.groupby('month')[self.features].mean()

        for feature in self.features:
            plt.plot(monthly_means.index, monthly_means[feature],
                     marker='o', linewidth=2, label=feature)

        plt.title('Monthly Trends in Audio Features', fontsize=16, pad=20)
        plt.xlabel('Month', fontsize=14)
        plt.ylabel('Average Value', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig('monthly_trends.png', dpi=300, bbox_inches='tight')
        plt.close()

    def create_region_comparison(self):
        print("Creating region comparison visualization...")
        region_means = self.df.groupby('region')[self.features].mean().round(3)

        fig = go.Figure()

        for region in region_means.index:
            fig.add_trace(
                go.Bar(
                    name=region,
                    x=self.features,
                    y=region_means.loc[region],
                    visible=(region == region_means.index[0])
                )
            )

        buttons = []
        for i, region in enumerate(region_means.index):
            visibility = [i == j for j in range(len(region_means.index))]
            buttons.append(dict(label=region, method="update", args=[{"visible": visibility}]))

        fig.update_layout(
            updatemenus=[{
                'buttons': buttons,
                'direction': 'down',
                'showactive': True,
                'x': 0.1,
                'y': 1.1,
                'xanchor': 'left',
                'yanchor': 'top'
            }],
            height=500,
            title="Audio Features by Region",
            yaxis_range=[0, 1],
            xaxis={'tickangle': -45},
            showlegend=False
        )

        fig.write_html('region_comparison.html', include_plotlyjs='cdn', full_html=False)

    def create_feature_timeline(self):
        print("Creating feature timeline visualization...")
        initial_feature = self.features[0]
        initial_region = sorted(self.df['region'].unique())[0]

        fig = go.Figure()

        for feature in self.features:
            for region in sorted(self.df['region'].unique()):
                region_data = self.df[self.df['region'] == region]
                daily_means = region_data.groupby('day_of_year')[feature].mean()

                visible = (feature == initial_feature) and (region == initial_region)

                fig.add_trace(
                    go.Scatter(
                        x=daily_means.index,
                        y=daily_means.values,
                        name=f"{region} - {feature}",
                        visible=visible,
                        line=dict(width=2)
                    )
                )

        feature_buttons = []
        region_buttons = []

        for feature in self.features:
            visibility = [(f == feature and r == initial_region)
                          for f in self.features
                          for r in sorted(self.df['region'].unique())]
            feature_buttons.append(dict(label=feature.capitalize(),
                                        method="update",
                                        args=[{"visible": visibility}]))

        for region in sorted(self.df['region'].unique()):
            visibility = [(f == initial_feature and r == region)
                          for f in self.features
                          for r in sorted(self.df['region'].unique())]
            region_buttons.append(dict(label=region,
                                       method="update",
                                       args=[{"visible": visibility}]))

        fig.update_layout(
            height=500,
            title="Audio Feature Timeline by Region",
            updatemenus=[
                dict(buttons=feature_buttons,
                     direction="down",
                     showactive=True,
                     x=0.1,
                     y=1.1,
                     xanchor="left",
                     yanchor="top"),
                dict(buttons=region_buttons,
                     direction="down",
                     showactive=True,
                     x=0.4,
                     y=1.1,
                     xanchor="left",
                     yanchor="top")
            ],
            showlegend=False,
            yaxis_range=[0, 1],
            xaxis_title="Day of Year",
            yaxis_title="Feature Value"
        )

        fig.write_html('feature_timeline.html', include_plotlyjs='cdn', full_html=False)

    def create_seasonal_distribution(self):
        print("Creating seasonal distribution visualization...")
        features_subset = ['acousticness', 'danceability', 'energy', 'valence']

        melted_df = self.df.melt(
            id_vars=['season'],
            value_vars=features_subset,
            var_name='feature',
            value_name='value'
        )

        # Create a box plot instead of violin plot
        chart = alt.Chart(melted_df).mark_boxplot(
            extent='min-max',  # Show whiskers from min to max
            size=20
        ).encode(
            x=alt.X('season:N', title='Season'),
            y=alt.Y('value:Q', title='Value'),
            color=alt.Color('feature:N',
                            legend=alt.Legend(title='Audio Feature'),
                            scale=alt.Scale(scheme='category10')),
            column=alt.Column(
                'feature:N',
                title='Distribution of Audio Features by Season',
                header=alt.Header(labelOrient='bottom')
            )
        ).properties(
            width=150,
            height=300
        ).configure_axis(
            labelFontSize=12,
            titleFontSize=14
        ).configure_header(
            titleFontSize=16,
            labelFontSize=14
        )

        chart.save('seasonal_distribution.html')

    def run_all(self):
        self.load_data()
        self.create_monthly_trends()
        self.create_region_comparison()
        self.create_feature_timeline()
        self.create_seasonal_distribution()
        print("All visualizations created successfully!")


if __name__ == "__main__":
    visualizer = SpotifyVisualizations('spotify_charts_with_features_2018_complete.csv')
    visualizer.run_all()