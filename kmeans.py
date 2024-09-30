# kmeans.py

import numpy as np

class KMeans:
    def __init__(self, n_clusters=3, init_method='random', max_iter=100):
        self.n_clusters = n_clusters
        self.init_method = init_method
        self.max_iter = max_iter
        self.centroids = None
        self.labels = None

    def fit(self, X):
        self._initialize_centroids(X)

        for _ in range(self.max_iter):
            old_centroids = self.centroids.copy()

            distances = self._compute_distances(X)
            self.labels = np.argmin(distances, axis=1)

            self._update_centroids(X)

            if np.allclose(self.centroids, old_centroids):
                break

    def step(self, X):
        if self.centroids is None:
            self._initialize_centroids(X)

        distances = self._compute_distances(X)
        self.labels = np.argmin(distances, axis=1)

        self._update_centroids(X)

    def _initialize_centroids(self, X):
        if self.init_method == 'random':
            indices = np.random.choice(X.shape[0], self.n_clusters, replace=False)
            self.centroids = X[indices]
        elif self.init_method == 'farthest':
            self.centroids = self._initialize_farthest(X)
        elif self.init_method == 'kmeans++':
            self.centroids = self._initialize_kmeanspp(X)
        elif self.init_method == 'manual':
            self.centroids = np.empty((0, X.shape[1]))
        else:
            raise ValueError("Invalid initialization method.")

    def add_centroid(self, centroid):
        self.centroids = np.vstack([self.centroids, centroid])

    def _compute_distances(self, X):
        distances = np.linalg.norm(X[:, np.newaxis] - self.centroids, axis=2)
        return distances

    def _update_centroids(self, X):
        for i in range(self.n_clusters):
            points = X[self.labels == i]
            if len(points) > 0:
                self.centroids[i] = points.mean(axis=0)

    def _initialize_farthest(self, X):
        centroids = [X[np.random.randint(len(X))]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            next_centroid = X[np.argmax(distances)]
            centroids.append(next_centroid)
        return np.array(centroids)

    def _initialize_kmeanspp(self, X):
        centroids = [X[np.random.randint(len(X))]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) ** 2 for c in centroids]) for x in X])
            probabilities = distances / distances.sum()
            cumulative_probabilities = probabilities.cumsum()
            r = np.random.rand()
            for idx, cumulative_probability in enumerate(cumulative_probabilities):
                if r < cumulative_probability:
                    centroids.append(X[idx])
                    break
        return np.array(centroids)
